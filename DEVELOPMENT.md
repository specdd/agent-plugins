# Development

This repository is the source of truth for generated SpecDD agent plugins.
Normal contributors should change source files only and open a pull request
against this repository.

## Contributing Changes

Most changes belong under `src/`:

- `src/skills`: shared skill specs and `SKILL.md.ejs` templates.
- `src/fragments`: reusable rendered skill fragments.
- `src/shared`: files copied into every plugin output.
- `src/plugins/codex`: Codex-specific package files.
- `src/plugins/claude`: Claude-specific package files.
- `src/plugins/copilot`: GitHub Copilot skills package files.
- `src/plugins/junie`: Junie skills package files.
- `src/plugins/cline`: Cline skills package files.
- `src/plugins/antigravity`: Antigravity plugin package files.
- `src/build`: build tooling and product target config.

Do not edit generated files in `plugins/*` for ordinary contributions. Those
repositories are generated outputs and their direct issues or pull requests are
not considered.

After changing source files, verify generated output is current:

```bash
make build
make check
```

When the product validators are available locally, run the full plugin test
target too:

```bash
make test
```

`make test` currently runs validators for Codex, Claude, Copilot, Cline, and
Antigravity. Junie is rendered by `make build` and checked by `make check`; it
does not have a Makefile validator until a stable native validator exists.

Then open a pull request against:

https://github.com/specdd/agent-plugins

## Release Process

Release work publishes generated output to the plugin repositories:

- `plugins/codex`: https://github.com/specdd/plugin-codex
- `plugins/claude`: https://github.com/specdd/plugin-claude
- `plugins/copilot`: https://github.com/specdd/plugin-copilot
- `plugins/junie`: https://github.com/specdd/plugin-junie
- `plugins/cline`: https://github.com/specdd/plugin-cline
- `plugins/antigravity`: https://github.com/specdd/plugin-antigravity

The Makefile `PLUGINS` variable controls which generated plugin repositories
are included in `modules-release`. It currently includes every generated
plugin repository: Codex, Claude, Copilot, Junie, Cline, and Antigravity.

After cloning the root repository, initialize submodules:

```bash
make modules-init
```

To discard local generated plugin output and pull the latest plugin repos:

```bash
make modules-reset
```

Plugin versions come from `plugin-versions.json`. Update that file before a
release when any generated plugin version changes.

Build, validate, commit, and push generated plugin repositories:

```bash
make modules-release
```

This target builds generated output, checks freshness, validates the
release-ready plugin outputs, asks for confirmation, then skips any plugin in
`PLUGINS` that has no generated changes. For changed plugins, it checks that
the version tag does not already exist locally or on `origin`, commits the
submodule with `Release <version>`, creates a signed tag named with the exact
`plugin-versions.json` version string, and pushes both the branch and tag.

The Codex validator defaults to
`$CODEX_HOME/skills/.system/plugin-creator/scripts/validate_plugin.py`, with
`CODEX_HOME` defaulting to `~/.codex`. Antigravity defaults to
`$HOME/.local/bin/agy`. Override `CODEX_PLUGIN_VALIDATOR`, `CLAUDE`, `GH`,
`CLINE_VALIDATOR`, `AGY`, `NODE`, or `PYTHON` when using different local tool
paths.

For future generated plugins, add or confirm their validator, add the validator
to `validate-plugins`, add the plugin name to `PLUGINS`, run `make test`, and
only then let `make modules-release` commit and push it.

After plugin submodules are pushed, commit the root repository changes. This
records source changes and updates the root repository's submodule pointers to
the plugin commits that were just pushed:

```bash
git status
git add plugin-versions.json src README.md DEVELOPMENT.md Makefile repo.sdd plugins/codex plugins/claude plugins/copilot plugins/junie plugins/cline plugins/antigravity
git commit -m "Release agent plugins"
git push
```

Adjust the `git add` paths to match the files changed for the release. Always
include the plugin submodule paths that `make modules-release` committed,
because those paths are the gitlinks recorded by the root repository. When new
targets are added to `PLUGINS`, include their `plugins/<target>` paths too.

Do not run `git submodule update` after `make modules-release`. That command
syncs submodules to the commits already recorded by the root repository; after a
release, the root repository first needs to record the new plugin commits.
