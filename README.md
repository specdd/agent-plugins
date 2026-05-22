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
- Homepage: https://specdd.ai
- License: Apache-2.0

Plugin output repositories are checked out as submodules under [`plugins`](plugins).

## Source Layout

- [`src/skills`](src/skills): shared skill specs and `SKILL.md.ejs` templates.
- [`src/fragments`](src/fragments): reusable rendered instruction fragments.
- [`src/shared`](src/shared): shared assets copied into every plugin output.
- [`src/plugins/codex`](src/plugins/codex): Codex-specific package files.
- [`src/plugins/claude`](src/plugins/claude): Claude-specific package files.
- [`src/build`](src/build): build tooling for generated plugin output.

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

Build generated plugin outputs, check freshness, and run product validators:

```bash
make test
```

`make test` validates `plugins/codex` with the Codex plugin validator and
`plugins/claude` with `claude plugin validate`.

Release generated plugin repositories:

```bash
make modules-release
```

`make modules-release` runs the full test target, asks for confirmation, then
commits and pushes changes in each plugin submodule.

Discard local plugin output changes and pull the latest plugin repositories:

```bash
make modules-reset
```

`make modules-reset` resets and cleans each plugin submodule to `origin/main`.

The Codex validator defaults to
`$CODEX_HOME/skills/.system/plugin-creator/scripts/validate_plugin.py`, with
`CODEX_HOME` defaulting to `~/.codex`. Override `CODEX_PLUGIN_VALIDATOR`,
`CLAUDE`, or `PYTHON` when using different local tool paths.

## Legal

Copyright (c) 2026 Matīss Treinis and SpecDD contributors

SpecDD is licensed under the Apache License 2.0. SpecDD™ is a trademark of Matīss Treinis.
