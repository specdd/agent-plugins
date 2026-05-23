.PHONY: build check clean modules-init modules-release modules-reset preflight-tools release-agentskills-github test validate validate-agentskills validate-antigravity validate-claude validate-cline validate-codex validate-copilot validate-outputs

PLUGIN_REPOS := codex claude copilot junie cline antigravity
AGENT_SKILLS_REPOS := agentskills
GENERATED_REPOS := $(PLUGIN_REPOS) $(AGENT_SKILLS_REPOS)
AGY ?= $(HOME)/.local/bin/agy
AWK ?= awk
GPG ?= gpg
GH ?= gh
NODE ?= node
CODEX_HOME ?= $(HOME)/.codex
CODEX_PLUGIN_VALIDATOR ?= $(CODEX_HOME)/skills/.system/plugin-creator/scripts/validate_plugin.py
CLINE_VALIDATOR ?= src/build/vendor/cline-validator.js
AGENTSKILLS_VALIDATOR ?= src/build/vendor/agentskills-validator.js
AGENTSKILLS_GITHUB_REPO ?= specdd/agentskills
AGENTSKILLS_SIGNING_KEY ?= FD87313256E08C486951F9091372D38569116BC5
CLAUDE ?= claude
PYTHON ?= python3
YARN ?= yarn

build: preflight-tools clean
	$(YARN) build

check: preflight-tools
	$(YARN) build:check

clean: preflight-tools
	$(YARN) clean

modules-init: preflight-tools
	git submodule sync --recursive
	git submodule update --init --recursive

preflight-tools:
	@command -v git >/dev/null || { echo "Missing git"; exit 1; }
	@command -v make >/dev/null || { echo "Missing make"; exit 1; }
	@command -v "$(AGY)" >/dev/null || test -x "$(AGY)" || { echo "Missing Antigravity CLI: $(AGY)"; exit 1; }
	@command -v "$(AWK)" >/dev/null || { echo "Missing awk executable: $(AWK)"; exit 1; }
	@command -v "$(CLAUDE)" >/dev/null || { echo "Missing Claude CLI: $(CLAUDE)"; exit 1; }
	@command -v "$(GPG)" >/dev/null || { echo "Missing GPG executable: $(GPG)"; exit 1; }
	@command -v "$(GH)" >/dev/null || { echo "Missing GitHub CLI: $(GH)"; exit 1; }
	@command -v "$(NODE)" >/dev/null || { echo "Missing Node executable: $(NODE)"; exit 1; }
	@command -v "$(PYTHON)" >/dev/null || { echo "Missing Python executable: $(PYTHON)"; exit 1; }
	@command -v "$(YARN)" >/dev/null || { echo "Missing Yarn executable: $(YARN)"; exit 1; }

test: preflight-tools build check validate-outputs

validate: preflight-tools check validate-outputs

validate-outputs: preflight-tools validate-codex validate-claude validate-copilot validate-cline validate-antigravity validate-agentskills

validate-codex:
	@test -f "$(CODEX_PLUGIN_VALIDATOR)" || { echo "Missing Codex plugin validator: $(CODEX_PLUGIN_VALIDATOR)"; exit 1; }
	@command -v "$(PYTHON)" >/dev/null || { echo "Missing Python executable: $(PYTHON)"; exit 1; }
	$(PYTHON) "$(CODEX_PLUGIN_VALIDATOR)" plugins/codex

validate-claude:
	@command -v "$(CLAUDE)" >/dev/null || { echo "Missing Claude CLI: $(CLAUDE)"; exit 1; }
	$(CLAUDE) plugin validate plugins/claude

validate-copilot:
	@command -v "$(GH)" >/dev/null || { echo "Missing GitHub CLI: $(GH)"; exit 1; }
	@$(GH) auth status >/dev/null 2>&1 || { echo "GitHub CLI is not authenticated"; exit 1; }
	$(GH) skill publish plugins/copilot --dry-run

validate-cline:
	@test -f "$(CLINE_VALIDATOR)" || { echo "Missing Cline validator: $(CLINE_VALIDATOR)"; exit 1; }
	@command -v "$(NODE)" >/dev/null || { echo "Missing Node executable: $(NODE)"; exit 1; }
	$(NODE) "$(CLINE_VALIDATOR)" plugins/cline

validate-antigravity:
	@test -x "$(AGY)" || command -v "$(AGY)" >/dev/null || { echo "Missing Antigravity CLI: $(AGY)"; exit 1; }
	$(AGY) plugin validate plugins/antigravity

validate-agentskills:
	@test -f "$(AGENTSKILLS_VALIDATOR)" || { echo "Missing Agent Skills validator: $(AGENTSKILLS_VALIDATOR)"; exit 1; }
	@command -v "$(NODE)" >/dev/null || { echo "Missing Node executable: $(NODE)"; exit 1; }
	$(NODE) "$(AGENTSKILLS_VALIDATOR)" plugins/agentskills

modules-release: preflight-tools test
	@$(GH) auth status >/dev/null 2>&1 || { echo "GitHub CLI is not authenticated"; exit 1; }
	@$(GPG) --list-secret-keys "$(AGENTSKILLS_SIGNING_KEY)" >/dev/null 2>&1 || { echo "Missing GPG secret key: $(AGENTSKILLS_SIGNING_KEY)"; exit 1; }
	@printf "Commit and push generated output repositories? [y/N] "; \
	read answer; \
	case "$$answer" in \
		y|Y|yes|YES) ;; \
		*) echo "Release cancelled."; exit 1 ;; \
	esac; \
	set -e; \
	for target in $(GENERATED_REPOS); do \
		echo "Releasing plugins/$$target"; \
		changes=$$(git -C plugins/$$target status --porcelain) || exit "$$?"; \
		if test -z "$$changes"; then \
			echo "No generated changes in plugins/$$target; skipping."; \
			continue; \
		fi; \
		version=$$($(AWK) -F'"' -v target="$$target" '$$2 == target { print $$4 }' plugin-versions.json); \
		if test -z "$$version"; then \
			echo "Missing version for $$target in plugin-versions.json"; \
			exit 1; \
		fi; \
		if git -C plugins/$$target rev-parse -q --verify "refs/tags/$$version" >/dev/null; then \
			echo "Tag $$version already exists in plugins/$$target"; \
			exit 1; \
		fi; \
		if git -C plugins/$$target ls-remote --exit-code --tags origin "refs/tags/$$version" >/dev/null 2>&1; then \
			echo "Tag $$version already exists on origin for plugins/$$target"; \
			exit 1; \
		else \
			status=$$?; \
			if test "$$status" -ne 2; then \
				echo "Unable to check origin tag $$version for plugins/$$target"; \
				exit "$$status"; \
			fi; \
		fi; \
		git -C plugins/$$target add -A; \
		git -C plugins/$$target commit -m "Release $$version"; \
		git -C plugins/$$target tag -s "$$version" -m "Release $$version"; \
		git -C plugins/$$target push; \
		git -C plugins/$$target push origin "$$version"; \
		case " $(AGENT_SKILLS_REPOS) " in \
			*" $$target "*) make release-agentskills-github VERSION="$$version" ;; \
		esac; \
	done

release-agentskills-github: preflight-tools
	@test -n "$(VERSION)" || { echo "Missing VERSION. Usage: make release-agentskills-github VERSION=<tag>"; exit 1; }
	@$(GH) auth status >/dev/null 2>&1 || { echo "GitHub CLI is not authenticated"; exit 1; }
	@$(GPG) --list-secret-keys "$(AGENTSKILLS_SIGNING_KEY)" >/dev/null 2>&1 || { echo "Missing GPG secret key: $(AGENTSKILLS_SIGNING_KEY)"; exit 1; }
	@git -C plugins/agentskills rev-parse -q --verify "refs/tags/$(VERSION)" >/dev/null || { echo "Missing local agentskills tag: $(VERSION)"; exit 1; }
	@tmpdir=$$(mktemp -d); \
	trap 'rm -rf "$$tmpdir"' EXIT; \
	archive="$$tmpdir/agentskills.zip"; \
	signature="$$tmpdir/agentskills.zip.asc"; \
	git -C plugins/agentskills archive --format=zip --output "$$archive" "$(VERSION)"; \
	$(GPG) --batch --local-user "$(AGENTSKILLS_SIGNING_KEY)" --armor --detach-sign --output "$$signature" "$$archive"; \
	$(GPG) --verify "$$signature" "$$archive"; \
	$(GH) release create "$(VERSION)" "$$archive" "$$signature" --repo "$(AGENTSKILLS_GITHUB_REPO)" --title "$(VERSION)" --notes "Automatic release" --verify-tag

modules-reset: preflight-tools
	@for target in $(GENERATED_REPOS); do \
		echo "Resetting plugins/$$target"; \
		git -C plugins/$$target fetch origin; \
		git -C plugins/$$target reset --hard origin/main; \
		git -C plugins/$$target clean -fdx; \
	done
