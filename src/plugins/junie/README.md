# SpecDD Junie Skills

Reusable Junie skills for working in SpecDD projects.

## Install

Install globally by copying the skills into Junie's user skills directory:

```bash
git clone https://github.com/specdd/plugin-junie.git /tmp/specdd-plugin-junie
mkdir -p ~/.junie/skills
cp -R /tmp/specdd-plugin-junie/skills/* ~/.junie/skills/
```

For a project-local install, copy the skills into `.junie/skills/` instead.

Alternatively, install each skill with GitHub CLI source tracking:

```bash
gh skill install specdd/plugin-junie specdd-adopt --agent junie --scope user
gh skill install specdd/plugin-junie specdd-debug --agent junie --scope user
gh skill install specdd/plugin-junie specdd-do --agent junie --scope user
gh skill install specdd/plugin-junie specdd-docs --agent junie --scope user
gh skill install specdd/plugin-junie specdd-explain --agent junie --scope user
gh skill install specdd/plugin-junie specdd-orient --agent junie --scope user
gh skill install specdd/plugin-junie specdd-plan --agent junie --scope user
gh skill install specdd/plugin-junie specdd-refactor --agent junie --scope user
gh skill install specdd/plugin-junie specdd-review --agent junie --scope user
gh skill install specdd/plugin-junie specdd-risk --agent junie --scope user
gh skill install specdd/plugin-junie specdd-task --agent junie --scope user
gh skill install specdd/plugin-junie specdd-test --agent junie --scope user
gh skill install specdd/plugin-junie specdd-trace --agent junie --scope user
```

## More Info

Learn more about SpecDD at https://specdd.ai.

## Details

The skills help Junie read a target project's active `.specdd/bootstrap.md`
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
