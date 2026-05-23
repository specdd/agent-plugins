# SpecDD Agent Skills

Reusable Agent Skills-standard skills for working in SpecDD projects.

These skills help an Agent Skills-compatible agent understand how to work in a
SpecDD project: read the active bootstrap chain, resolve local `.sdd` authority,
plan changes, implement work, review diffs, write docs, assess risk, and keep
behavior aligned with the project's own specs.

If you just want to use the skills, start with the SpecDD CLI install. It pulls
the latest published release, places the skill directories where Agent
Skills-compatible clients expect them, and avoids copying files by hand.

## Install

### Installing using SpecDD CLI

`specdd agentskills deploy` installs SpecDD Agent Skills from the latest
`specdd/agentskills` GitHub release. This is the recommended path for most
users.

Before running the deploy command, make sure the SpecDD CLI is installed:

```bash
# Using NPM
npm install --global specdd

# Using Yarn
yarn global add specdd

# Using Homebrew
brew tap specdd/cli
brew install specdd
```

Choose the package manager you normally use. For more installation options and
current CLI documentation, see https://github.com/specdd/cli.

To install into the current project, run:

```bash
specdd agentskills deploy
```

That installs the skills into:

```text
<cwd>/.agents/skills
```

To install into another project directory, pass the project path:

```bash
specdd agentskills deploy path/to/project
```

To install into the current user's global Agent Skills directory, use `--user`:

```bash
specdd agentskills deploy --user
```

That installs the skills into:

```text
~/.agents/skills
```

To pin the install to a specific release tag, pass `--version`:

```bash
specdd agentskills deploy --version 1.0.1
specdd agentskills deploy --user --version 1.0.1
```

Use a project-local install when you want the skills to travel with a specific
repository. Use `--user` when you want the same skills available across all
projects for Agent Skills-compatible clients that read the global directory.

### Installing using Git

Manual git install is useful for inspection, local testing, or environments
where you cannot use the SpecDD CLI. In this repository, each skill directory
lives at the repository root.

```bash
git clone https://github.com/specdd/agentskills.git /tmp/specdd-agentskills
CLIENT_SKILLS_DIR=/path/to/client/skills
mkdir -p "$CLIENT_SKILLS_DIR"
cp -R /tmp/specdd-agentskills/specdd-* "$CLIENT_SKILLS_DIR"/
```

Follow your client's Agent Skills documentation for reload behavior after
manual installation.

## More Info

Learn more about SpecDD at https://specdd.ai.

Learn more about the Agent Skills standard at https://agentskills.io/specification.

## Details

This distribution includes focused skills for orientation, explanation,
planning, implementation, review, testing, tracing, documentation, refactoring,
debugging, risk assessment, task handling, and SpecDD adoption work.

The skills do not replace the `specdd` CLI, install SpecDD framework files, or
make this repository authoritative for your project. They are behavior guidance
for agents. Your project's own `.specdd/bootstrap.md`, project/local bootstrap
files, and active `.sdd` contracts remain the source of truth.

This repository is generated automatically from the SpecDD agent plugins source
repository:

https://github.com/specdd/agent-plugins

Do not edit generated files in this repository directly. Changes to skills,
shared assets, documentation, or build behavior should be made in
`specdd/agent-plugins` and rebuilt into this generated package repository.

Do not submit issues or pull requests in this generated package repository; they
will not be considered. Use the source repository instead:

https://github.com/specdd/agent-plugins/issues

## Legal

Copyright (c) 2026 Matīss Treinis and SpecDD contributors

SpecDD is licensed under the Apache License 2.0. SpecDD(TM) is a trademark of Matīss Treinis.
