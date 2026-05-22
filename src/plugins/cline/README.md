# SpecDD Cline Skills

Reusable Cline skills for working in SpecDD projects.

## Install

Install globally by copying the skills into Cline's user skills directory:

```bash
git clone https://github.com/specdd/plugin-cline.git /tmp/specdd-plugin-cline
mkdir -p ~/.cline/skills
cp -R /tmp/specdd-plugin-cline/skills/* ~/.cline/skills/
```

For a project-local install, copy the skills into `.cline/skills/` instead.

Alternatively, install each skill with GitHub CLI source tracking:

```bash
gh skill install specdd/plugin-cline specdd-adopt --agent cline --scope user
gh skill install specdd/plugin-cline specdd-debug --agent cline --scope user
gh skill install specdd/plugin-cline specdd-do --agent cline --scope user
gh skill install specdd/plugin-cline specdd-docs --agent cline --scope user
gh skill install specdd/plugin-cline specdd-explain --agent cline --scope user
gh skill install specdd/plugin-cline specdd-orient --agent cline --scope user
gh skill install specdd/plugin-cline specdd-plan --agent cline --scope user
gh skill install specdd/plugin-cline specdd-refactor --agent cline --scope user
gh skill install specdd/plugin-cline specdd-review --agent cline --scope user
gh skill install specdd/plugin-cline specdd-risk --agent cline --scope user
gh skill install specdd/plugin-cline specdd-task --agent cline --scope user
gh skill install specdd/plugin-cline specdd-test --agent cline --scope user
gh skill install specdd/plugin-cline specdd-trace --agent cline --scope user
```

## More Info

Learn more about SpecDD at https://specdd.ai.

## Details

The skills help Cline read a target project's active `.specdd/bootstrap.md`
chain, resolve local spec authority, and work through orientation, explanation,
planning, implementation, review, testing, tracing, documentation, refactoring,
debugging, and risk assessment.

This repository is generated automatically from the SpecDD agent plugins source
repository:

https://github.com/specdd/agent-plugins

Do not edit generated files in this repository directly. Changes to skills,
shared assets, documentation, or build behavior should be made in
`specdd/agent-plugins` and rebuilt into this plugin repository.

Do not submit issues or pull requests in this generated plugin repository; they
will not be considered. Use the source repository instead:

https://github.com/specdd/agent-plugins/issues

## Legal

Copyright (c) 2026 Matīss Treinis and SpecDD contributors

SpecDD is licensed under the Apache License 2.0. SpecDD™ is a trademark of Matīss Treinis.
