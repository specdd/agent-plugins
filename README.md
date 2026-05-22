# SpecDD Agent Plugins

Reusable SpecDD skills for agent development workflows.

This repository is the source-of-truth build repo for product-specific SpecDD
agent plugins. It does not replace the `specdd` CLI or install framework files.
Generated plugins help agents read a target project's active
`.specdd/bootstrap.md` chain, resolve local spec authority, and work through
orientation, explanation, planning, implementation, review, testing, tracing,
documentation, refactoring, debugging, and risk assessment.

## Repositories

- Source repo: https://github.com/specdd/agent-plugins
- Codex plugin output: https://github.com/specdd/plugin-codex
- Claude plugin output: https://github.com/specdd/plugin-claude
- GitHub Copilot skills output: https://github.com/specdd/plugin-copilot
- Junie skills output: https://github.com/specdd/plugin-junie
- Cline skills output: https://github.com/specdd/plugin-cline
- Antigravity plugin output: https://github.com/specdd/plugin-antigravity
- Homepage: https://specdd.ai
- License: Apache-2.0

Plugin output repositories are checked out as submodules under [`plugins`](plugins).

## Supported Agents

| Agent          | Output repo                 | Install path                                                                                                                                           | Validation                                                                                                    |
|----------------|-----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| Codex          | `specdd/plugin-codex`       | `codex plugin marketplace add specdd/specdd --ref main`, then `codex plugin add specdd@specdd`                                                         | `make test` runs the Codex plugin validator.                                                                  |
| Claude Code    | `specdd/plugin-claude`      | `claude plugin marketplace add specdd/specdd`, then `claude plugin install specdd@specdd`                                                              | `make test` runs `claude plugin validate plugins/claude`.                                                     |
| GitHub Copilot | `specdd/plugin-copilot`     | Install each skill with `gh skill install specdd/plugin-copilot <skill>`.                                                                              | `make test` runs `gh skill publish plugins/copilot --dry-run`.                                                |
| Junie          | `specdd/plugin-junie`       | Copy `skills/*` into `~/.junie/skills/` or `.junie/skills/`; `gh skill install --agent junie` is a secondary tracked install path.                     | Built and checked by `make build` and `make check`; no Makefile validator until a stable native validator exists. |
| Cline          | `specdd/plugin-cline`       | Copy `skills/*` into `~/.cline/skills/` or `.cline/skills/`; `gh skill install --agent cline` is a secondary tracked install path.                     | `make test` runs the project-local Cline validator.                                                           |
| Antigravity    | `specdd/plugin-antigravity` | `agy plugin install https://github.com/specdd/plugin-antigravity.git`; marketplace install can be added when an Antigravity marketplace is configured. | `make test` runs `agy plugin validate plugins/antigravity`.                                                   |

## Source Layout

- [`src/skills`](src/skills): shared skill specs and `SKILL.md.ejs` templates.
- [`src/fragments`](src/fragments): reusable rendered instruction fragments.
- [`src/shared`](src/shared): shared assets copied into every plugin output.
- [`src/plugins/codex`](src/plugins/codex): Codex-specific package files.
- [`src/plugins/claude`](src/plugins/claude): Claude-specific package files.
- [`src/plugins/copilot`](src/plugins/copilot): GitHub Copilot skills package files.
- [`src/plugins/junie`](src/plugins/junie): Junie skills package files.
- [`src/plugins/cline`](src/plugins/cline): Cline skills package files.
- [`src/plugins/antigravity`](src/plugins/antigravity): Antigravity plugin package files.
- [`src/build`](src/build): build tooling and project-local validators.

## Skills

- `specdd-adopt`: create or improve `.sdd` specs.
- `specdd-orient`: read bootstraps, inspect repo shape, and get ready for tasks.
- `specdd-explain`: explain specs in succinct human language.
- `specdd-plan`: plan a change under existing specs.
- `specdd-do`: implement a change under existing specs.
- `specdd-review`: review changes against specs.
- `specdd-task`: find, add, organize, and verify SpecDD tasks.
- `specdd-trace`: map specs to code, tests, and changed files.
- `specdd-test`: derive focused tests from governing specs.
- `specdd-refactor`: change structure without changing specified behavior.
- `specdd-debug`: diagnose bugs against the governing contract.
- `specdd-docs`: turn specs into user or developer documentation.
- `specdd-risk`: classify change risk before work starts.

## Development

Before changing this repository, read [`.specdd/bootstrap.md`](.specdd/bootstrap.md)
and [repo.sdd](repo.sdd). The project spec grants repository-wide write
authority but requires generated plugin behavior to defer to the target
project's own SpecDD bootstrap chain.

Build generated plugin outputs:

```bash
make build
```

Initialize plugin submodules after cloning:

```bash
make modules-init
```

Check that generated plugin outputs are current:

```bash
make check
```

Build generated plugin outputs, check freshness, and run available product
validators:

```bash
make test
```

`make test` validates `plugins/codex` with the Codex plugin validator,
`plugins/claude` with `claude plugin validate`, `plugins/copilot` with
`gh skill publish --dry-run`, `plugins/cline` with the project-local Cline
validator, and `plugins/antigravity` with `agy plugin validate`. Junie is
built and checked, but it does not have a Makefile validator until a stable
native validator exists.

Release generated plugin repositories:

```bash
make modules-release
```

`make modules-release` runs the full test target, asks for confirmation, then
commits and pushes changed plugin submodules listed in the Makefile `PLUGINS`
variable. Plugins with no generated changes are skipped before version, tag,
commit, or push operations. At present, `PLUGINS` includes every generated
plugin output: Codex, Claude, Copilot, Junie, Cline, and Antigravity.

Discard local plugin output changes and pull the latest plugin repositories:

```bash
make modules-reset
```

`make modules-reset` resets and cleans each plugin submodule to `origin/main`.

The Codex validator defaults to
`$CODEX_HOME/skills/.system/plugin-creator/scripts/validate_plugin.py`, with
`CODEX_HOME` defaulting to `~/.codex`. Antigravity defaults to
`$HOME/.local/bin/agy`. Override `CODEX_PLUGIN_VALIDATOR`, `CLAUDE`, `GH`,
`CLINE_VALIDATOR`, `AGY`, `NODE`, or `PYTHON` when using different local tool
paths.

## Legal

Copyright (c) 2026 Matīss Treinis and SpecDD contributors

SpecDD is licensed under the Apache License 2.0. SpecDD™ is a trademark of Matīss Treinis.
