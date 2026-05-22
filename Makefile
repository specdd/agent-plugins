.PHONY: build check clean modules-init modules-release modules-reset test validate validate-antigravity validate-claude validate-cline validate-codex validate-copilot validate-plugins

PLUGINS := codex claude copilot junie cline antigravity
AGY ?= $(HOME)/.local/bin/agy
GH ?= gh
NODE ?= node
CODEX_HOME ?= $(HOME)/.codex
CODEX_PLUGIN_VALIDATOR ?= $(CODEX_HOME)/skills/.system/plugin-creator/scripts/validate_plugin.py
CLINE_VALIDATOR ?= src/build/vendor/cline-validator.js
CLAUDE ?= claude
PYTHON ?= python3

build: clean
	yarn build

check:
	yarn build:check

clean:
	yarn clean

modules-init:
	git submodule sync --recursive
	git submodule update --init --recursive

modules-release: test
	@printf "Commit and push generated plugin repositories? [y/N] "; \
	read answer; \
	case "$$answer" in \
		y|Y|yes|YES) ;; \
		*) echo "Release cancelled."; exit 1 ;; \
	esac; \
	set -e; \
	for plugin in $(PLUGINS); do \
		echo "Releasing plugins/$$plugin"; \
		changes=$$(git -C plugins/$$plugin status --porcelain) || exit "$$?"; \
		if test -z "$$changes"; then \
			echo "No generated changes in plugins/$$plugin; skipping."; \
			continue; \
		fi; \
		version=$$(awk -F'"' -v plugin="$$plugin" '$$2 == plugin { print $$4 }' plugin-versions.json); \
		if test -z "$$version"; then \
			echo "Missing version for $$plugin in plugin-versions.json"; \
			exit 1; \
		fi; \
		if git -C plugins/$$plugin rev-parse -q --verify "refs/tags/$$version" >/dev/null; then \
			echo "Tag $$version already exists in plugins/$$plugin"; \
			exit 1; \
		fi; \
		if git -C plugins/$$plugin ls-remote --exit-code --tags origin "refs/tags/$$version" >/dev/null 2>&1; then \
			echo "Tag $$version already exists on origin for plugins/$$plugin"; \
			exit 1; \
		else \
			status=$$?; \
			if test "$$status" -ne 2; then \
				echo "Unable to check origin tag $$version for plugins/$$plugin"; \
				exit "$$status"; \
			fi; \
		fi; \
		git -C plugins/$$plugin add -A; \
		git -C plugins/$$plugin commit -m "Release $$version"; \
		git -C plugins/$$plugin tag -s "$$version" -m "Release $$version"; \
		git -C plugins/$$plugin push; \
		git -C plugins/$$plugin push origin "$$version"; \
	done

test: build check validate-plugins

validate: check validate-plugins

validate-plugins: validate-codex validate-claude validate-copilot validate-cline validate-antigravity

validate-codex:
	@test -f "$(CODEX_PLUGIN_VALIDATOR)" || { echo "Missing Codex plugin validator: $(CODEX_PLUGIN_VALIDATOR)"; exit 1; }
	$(PYTHON) "$(CODEX_PLUGIN_VALIDATOR)" plugins/codex

validate-claude:
	@command -v "$(CLAUDE)" >/dev/null || { echo "Missing Claude CLI: $(CLAUDE)"; exit 1; }
	$(CLAUDE) plugin validate plugins/claude

validate-copilot:
	@command -v "$(GH)" >/dev/null || { echo "Missing GitHub CLI: $(GH)"; exit 1; }
	$(GH) skill publish plugins/copilot --dry-run

validate-cline:
	@test -f "$(CLINE_VALIDATOR)" || { echo "Missing Cline validator: $(CLINE_VALIDATOR)"; exit 1; }
	$(NODE) "$(CLINE_VALIDATOR)" plugins/cline

validate-antigravity:
	@test -x "$(AGY)" || command -v "$(AGY)" >/dev/null || { echo "Missing Antigravity CLI: $(AGY)"; exit 1; }
	$(AGY) plugin validate plugins/antigravity

modules-reset:
	@for plugin in $(PLUGINS); do \
		echo "Resetting plugins/$$plugin"; \
		git -C plugins/$$plugin fetch origin; \
		git -C plugins/$$plugin reset --hard origin/main; \
		git -C plugins/$$plugin clean -fdx; \
	done
