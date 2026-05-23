# Development

This repository is the source of truth for generated SpecDD agent plugins and
the SpecDD Agent Skills standard distribution. Normal contributors should
change source files only and open a pull request against this repository.

## Contributing Changes

Most changes belong under `src/`:

- `src/skills`: shared skill specs and `SKILL.md.ejs` templates.
- `src/fragments`: reusable rendered skill fragments.
- `src/shared`: files copied into generated outputs.
- `src/plugins/codex`: Codex-specific package files.
- `src/plugins/claude`: Claude-specific package files.
- `src/plugins/copilot`: GitHub Copilot skills package files.
- `src/plugins/junie`: Junie skills package files.
- `src/plugins/cline`: Cline skills package files.
- `src/plugins/antigravity`: Antigravity plugin package files.
- `src/plugins/agentskills`: Agent Skills standard distribution files.
- `src/build`: build tooling and product target config.

Do not edit generated files in `plugins/*` for ordinary contributions. Those
repositories are generated outputs and their direct issues or pull requests are
not considered.

After changing source files, verify generated output is current:

```bash
make build
make check
```

When the target validators are available locally, run the full test target too:

```bash
make test
```

`make test` currently runs validators for Codex, Claude, Copilot, Cline,
Antigravity, and the Agent Skills standard distribution. Junie is rendered by
`make build` and checked by `make check`; it does not have a Makefile validator
until a stable native validator exists.

Then open a pull request against:

https://github.com/specdd/agent-plugins

## Release Process

Release work publishes generated output to product plugin repositories and the
Agent Skills standard distribution.

Plugin output repositories:

- `plugins/codex`: https://github.com/specdd/plugin-codex
- `plugins/claude`: https://github.com/specdd/plugin-claude
- `plugins/copilot`: https://github.com/specdd/plugin-copilot
- `plugins/junie`: https://github.com/specdd/plugin-junie
- `plugins/cline`: https://github.com/specdd/plugin-cline
- `plugins/antigravity`: https://github.com/specdd/plugin-antigravity

Agent Skills standard distribution:

- `plugins/agentskills`: https://github.com/specdd/agentskills

The Makefile `GENERATED_REPOS` variable controls which generated output
repositories are included in `modules-release`. Classic plugin outputs are
listed in `PLUGIN_REPOS`; the Agent Skills standard distribution is listed in
`AGENT_SKILLS_REPOS`.

After cloning the root repository, initialize submodules:

```bash
make modules-init
```

To discard local generated output and pull the latest generated repos:

```bash
make modules-reset
```

Generated target versions come from `plugin-versions.json`. Update that file
before a release when any generated output version changes.

Build, validate, commit, and push generated output repositories:

```bash
make modules-release
```

This target builds generated output, checks freshness, validates the
release-ready outputs, asks for confirmation, then skips any target in
`GENERATED_REPOS` that has no generated changes. Before any release work
starts, it verifies the external binaries, validators, GitHub CLI
authentication, and Agent Skills signing key needed by the release path so
missing tools fail before any prompt, commit, tag, push, or GitHub release side
effect. For changed targets, it checks that the version tag does not already
exist locally or on `origin`, commits the
submodule with `Release <version>`, creates a signed tag named with the exact
`plugin-versions.json` version string, and pushes both the branch and tag.
When the changed target is the Agent Skills standard distribution, it then
archives the exact pushed tag as `agentskills.zip`, signs it with GPG key
`FD87313256E08C486951F9091372D38569116BC5` as `agentskills.zip.asc`, verifies
the signature locally, and creates a GitHub release on `specdd/agentskills`
with the tag as the title and `Automatic release` as the description.

The Codex validator defaults to
`$CODEX_HOME/skills/.system/plugin-creator/scripts/validate_plugin.py`, with
`CODEX_HOME` defaulting to `~/.codex`. Antigravity defaults to
`$HOME/.local/bin/agy`. Override `CODEX_PLUGIN_VALIDATOR`, `CLAUDE`, `GH`,
`CLINE_VALIDATOR`, `AGENTSKILLS_VALIDATOR`, `AGENTSKILLS_GITHUB_REPO`,
`AGENTSKILLS_SIGNING_KEY`, `AWK`, `GPG`, `AGY`, `NODE`, `PYTHON`, or
`YARN` when using different local tool paths or release settings.

The shared external-binary preflight can be run directly without creating a
release:

```bash
make preflight-tools
```

For future generated plugin outputs, add or confirm their validator, add the
validator to `validate-outputs`, add the target name to `PLUGIN_REPOS`, run
`make test`, and only then let `make modules-release` commit and push it. For
future standards-based skill distributions, add the target name to the relevant
non-plugin release variable instead.

After generated output submodules are pushed, commit the root repository
changes. This records source changes and updates the root repository's
submodule pointers to the generated output commits that were just pushed:

```bash
git status
git add plugin-versions.json src README.md DEVELOPMENT.md Makefile repo.sdd plugins/codex plugins/claude plugins/copilot plugins/junie plugins/cline plugins/antigravity plugins/agentskills
git commit -m "Release generated agent outputs"
git push
```

Adjust the `git add` paths to match the files changed for the release. Always
include the generated output submodule paths that `make modules-release` committed,
because those paths are the gitlinks recorded by the root repository. When new
targets are added to `GENERATED_REPOS`, include their `plugins/<target>` paths
too.

Do not run `git submodule update` after `make modules-release`. That command
syncs submodules to the commits already recorded by the root repository; after
a release, the root repository first needs to record the new generated output
commits.
