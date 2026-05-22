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

Then open a pull request against:

https://github.com/specdd/agent-plugins

## Release Process

Release work publishes generated output to the plugin repositories:

- `plugins/codex`: https://github.com/specdd/plugin-codex
- `plugins/claude`: https://github.com/specdd/plugin-claude

After cloning the root repository, initialize submodules:

```bash
make modules-init
```

To discard local generated plugin output and pull the latest plugin repos:

```bash
make modules-reset
```

Plugin versions come from `plugin-versions.json`. Update that file before a
release when either plugin version changes.

Build, validate, commit, and push generated plugin repositories:

```bash
make modules-release
```

This target builds generated output, checks freshness, validates `plugins/codex`
with the Codex plugin validator, validates `plugins/claude` with
`claude plugin validate`, asks for confirmation, then checks that each plugin's
version tag does not already exist locally or on `origin`. It commits each
plugin submodule with `Release <version>`, creates a signed tag named with the
exact `plugin-versions.json` version string, and pushes both the branch and tag.

The Codex validator defaults to
`$CODEX_HOME/skills/.system/plugin-creator/scripts/validate_plugin.py`, with
`CODEX_HOME` defaulting to `~/.codex`. Override `CODEX_PLUGIN_VALIDATOR`,
`CLAUDE`, or `PYTHON` when using different local tool paths.

After plugin submodules are pushed, commit the root repository changes. This
records source changes and updates the root repository's submodule pointers to
the plugin commits that were just pushed:

```bash
git status
git add plugin-versions.json src README.md DEVELOPMENT.md Makefile repo.sdd plugins/codex plugins/claude
git commit -m "Release agent plugins"
git push
```

Adjust the `git add` paths to match the files changed for the release. Always
include `plugins/codex` and `plugins/claude` when `make modules-release`
created new plugin commits, because those paths are the gitlinks recorded by
the root repository.

Do not run `git submodule update` after `make modules-release`. That command
syncs submodules to the commits already recorded by the root repository; after a
release, the root repository first needs to record the new plugin commits.
