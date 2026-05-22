#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const DESCRIPTION_MAX_CHARS = 1024;
const BODY_TOKEN_BUDGET = 5000;
const CONSERVATIVE_CHARS_PER_TOKEN = 3;
const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const pluginRootArg = process.argv[2];

if (!pluginRootArg || process.argv.length !== 3) {
  console.error("Usage: node src/build/vendor/cline-validator.js <plugin-dir>");
  process.exit(1);
}

const pluginRoot = path.resolve(process.cwd(), pluginRootArg);
const skillsDir = path.join(pluginRoot, "skills");
const errors = [];
const stats = {
  skills: 0,
  longestDescription: { name: "", chars: 0 },
  largestBody: { name: "", tokens: 0 },
};

validate();

function validate() {
  if (!isDirectory(pluginRoot)) {
    fail([`Plugin directory does not exist: ${pluginRoot}`]);
  }

  if (!isDirectory(skillsDir)) {
    fail([`Missing Cline skills directory: ${path.relative(process.cwd(), skillsDir)}`]);
  }

  const skillDirs = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name));

  if (skillDirs.length === 0) {
    errors.push(`No skill directories found in ${path.relative(process.cwd(), skillsDir)}`);
  }

  for (const skillDir of skillDirs) {
    validateSkill(skillDir.name, path.join(skillsDir, skillDir.name));
  }

  if (errors.length > 0) {
    fail(errors);
  }

  console.log(
    `[cline-validator] Validated ${stats.skills} skills in ${path.relative(
      process.cwd(),
      pluginRoot,
    )}.`,
  );
  console.log(
    `[cline-validator] Longest description: ${stats.longestDescription.name} ` +
      `${stats.longestDescription.chars}/${DESCRIPTION_MAX_CHARS} chars.`,
  );
  console.log(
    `[cline-validator] Largest body estimate: ${stats.largestBody.name} ` +
      `<=${stats.largestBody.tokens}/${BODY_TOKEN_BUDGET} tokens.`,
  );
}

function validateSkill(skillName, skillDir) {
  stats.skills += 1;

  if (!SKILL_NAME_PATTERN.test(skillName)) {
    errors.push(`${displayPath(skillDir)}: skill directory name must be kebab-case`);
  }

  const skillFile = path.join(skillDir, "SKILL.md");
  if (!isFile(skillFile)) {
    errors.push(`${displayPath(skillDir)}: missing SKILL.md`);
    return;
  }

  const text = fs.readFileSync(skillFile, "utf8");
  const parsed = parseFrontmatter(text, skillFile);
  if (!parsed) {
    return;
  }

  const { frontmatter, body } = parsed;
  const name = frontmatter.name || "";
  const description = frontmatter.description || "";

  if (!name) {
    errors.push(`${displayPath(skillFile)}: missing frontmatter field: name`);
  } else if (name !== skillName) {
    errors.push(
      `${displayPath(skillFile)}: frontmatter name "${name}" must match directory "${skillName}"`,
    );
  }

  if (!description) {
    errors.push(`${displayPath(skillFile)}: missing frontmatter field: description`);
  } else if (description.length > DESCRIPTION_MAX_CHARS) {
    errors.push(
      `${displayPath(skillFile)}: description is ${description.length} chars; max is ` +
        `${DESCRIPTION_MAX_CHARS}`,
    );
  }

  if (description.length > stats.longestDescription.chars) {
    stats.longestDescription = { name: skillName, chars: description.length };
  }

  if (!body.trim()) {
    errors.push(`${displayPath(skillFile)}: instruction body is empty`);
  }

  const bodyTokens = estimateTokens(body);
  if (bodyTokens >= BODY_TOKEN_BUDGET) {
    errors.push(
      `${displayPath(skillFile)}: body is estimated at <=${bodyTokens} tokens; must be under ` +
        `${BODY_TOKEN_BUDGET}`,
    );
  }

  if (bodyTokens > stats.largestBody.tokens) {
    stats.largestBody = { name: skillName, tokens: bodyTokens };
  }
}

function parseFrontmatter(text, file) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    errors.push(`${displayPath(file)}: missing YAML frontmatter block`);
    return null;
  }

  const frontmatter = {};
  const lines = match[1].split(/\r?\n/);

  lines.forEach((line, index) => {
    if (!line.trim() || line.trimStart().startsWith("#")) {
      return;
    }

    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!field) {
      errors.push(`${displayPath(file)}:${index + 2}: unsupported frontmatter syntax`);
      return;
    }

    const key = field[1];
    if (Object.prototype.hasOwnProperty.call(frontmatter, key)) {
      errors.push(`${displayPath(file)}:${index + 2}: duplicate frontmatter field: ${key}`);
      return;
    }

    frontmatter[key] = unquoteScalar(field[2].trim());
  });

  return {
    frontmatter,
    body: match[2],
  };
}

function unquoteScalar(value) {
  const doubleQuoted = value.match(/^"([\s\S]*)"$/);
  if (doubleQuoted) {
    return doubleQuoted[1].replace(/\\"/g, '"');
  }

  const singleQuoted = value.match(/^'([\s\S]*)'$/);
  if (singleQuoted) {
    return singleQuoted[1].replace(/''/g, "'");
  }

  return value;
}

function estimateTokens(text) {
  return Math.ceil(text.length / CONSERVATIVE_CHARS_PER_TOKEN);
}

function isDirectory(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isDirectory();
}

function isFile(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function displayPath(filePath) {
  return path.relative(process.cwd(), filePath);
}

function fail(messages) {
  for (const message of messages) {
    console.error(`[cline-validator] ${message}`);
  }
  process.exit(1);
}
