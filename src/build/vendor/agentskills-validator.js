#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const NAME_MAX_CHARS = 64;
const DESCRIPTION_MAX_CHARS = 1024;
const COMPATIBILITY_MAX_CHARS = 500;
const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const OPTIONAL_FIELDS = new Set(["license", "compatibility", "metadata", "allowed-tools"]);
const KNOWN_FIELDS = new Set(["name", "description", ...OPTIONAL_FIELDS]);

const packageRootArg = process.argv[2];

if (!packageRootArg || process.argv.length !== 3) {
  console.error("Usage: node src/build/vendor/agentskills-validator.js <package-dir>");
  process.exit(1);
}

const packageRoot = path.resolve(process.cwd(), packageRootArg);
const errors = [];
const stats = {
  skills: 0,
  longestDescription: { name: "", chars: 0 },
  largestBody: { name: "", lines: 0 },
};

validate();

function validate() {
  if (!isDirectory(packageRoot)) {
    fail([`Package directory does not exist: ${packageRoot}`]);
  }

  const entries = fs
    .readdirSync(packageRoot, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name));
  const directoryEntries = entries.filter((entry) => entry.isDirectory());
  const skillDirs = directoryEntries.filter((entry) =>
    isFile(path.join(packageRoot, entry.name, "SKILL.md")),
  );

  if (skillDirs.length === 0) {
    errors.push(`No root skill directories found in ${path.relative(process.cwd(), packageRoot)}`);
  }

  for (const entry of directoryEntries) {
    if (!isFile(path.join(packageRoot, entry.name, "SKILL.md"))) {
      errors.push(
        `${displayPath(path.join(packageRoot, entry.name))}: root directories must be skills with SKILL.md`,
      );
    }
  }

  for (const skillDir of skillDirs) {
    validateSkill(skillDir.name, path.join(packageRoot, skillDir.name));
  }

  if (errors.length > 0) {
    fail(errors);
  }

  console.log(
    `[agentskills-validator] Validated ${stats.skills} skills in ${path.relative(
      process.cwd(),
      packageRoot,
    )}.`,
  );
  console.log(
    `[agentskills-validator] Longest description: ${stats.longestDescription.name} ` +
      `${stats.longestDescription.chars}/${DESCRIPTION_MAX_CHARS} chars.`,
  );
  console.log(
    `[agentskills-validator] Largest body: ${stats.largestBody.name} ` +
      `${stats.largestBody.lines} lines.`,
  );
}

function validateSkill(skillName, skillDir) {
  stats.skills += 1;

  validateName(skillName, skillDir, "skill directory name");

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
  } else {
    validateName(name, skillFile, "frontmatter name");
    if (name !== skillName) {
      errors.push(
        `${displayPath(skillFile)}: frontmatter name "${name}" must match directory "${skillName}"`,
      );
    }
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

  if (frontmatter.compatibility !== undefined) {
    const compatibility = frontmatter.compatibility;
    if (!compatibility) {
      errors.push(`${displayPath(skillFile)}: compatibility must be nonempty when present`);
    } else if (compatibility.length > COMPATIBILITY_MAX_CHARS) {
      errors.push(
        `${displayPath(skillFile)}: compatibility is ${compatibility.length} chars; max is ` +
          `${COMPATIBILITY_MAX_CHARS}`,
      );
    }
  }

  if (frontmatter.license !== undefined && !frontmatter.license) {
    errors.push(`${displayPath(skillFile)}: license must be nonempty when present`);
  }

  if (frontmatter["allowed-tools"] !== undefined && !frontmatter["allowed-tools"]) {
    errors.push(`${displayPath(skillFile)}: allowed-tools must be nonempty when present`);
  }

  if (frontmatter.metadata !== undefined && !isPlainObject(frontmatter.metadata)) {
    errors.push(`${displayPath(skillFile)}: metadata must be a key-value mapping`);
  }

  if (!body.trim()) {
    errors.push(`${displayPath(skillFile)}: instruction body is empty`);
  }

  const bodyLines = body.trimEnd().split(/\r?\n/).length;
  if (bodyLines > stats.largestBody.lines) {
    stats.largestBody = { name: skillName, lines: bodyLines };
  }
}

function validateName(name, filePath, label) {
  if (name.length < 1 || name.length > NAME_MAX_CHARS) {
    errors.push(`${displayPath(filePath)}: ${label} must be 1-${NAME_MAX_CHARS} characters`);
    return;
  }

  if (!SKILL_NAME_PATTERN.test(name)) {
    errors.push(
      `${displayPath(filePath)}: ${label} must use lowercase letters, numbers, and single hyphens`,
    );
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
  let activeMap = null;

  lines.forEach((line, index) => {
    const lineNumber = index + 2;

    if (!line.trim() || line.trimStart().startsWith("#")) {
      return;
    }

    const nested = line.match(/^  ([^:]+):\s*(.*)$/);
    if (nested) {
      if (activeMap !== "metadata") {
        errors.push(
          `${displayPath(file)}:${lineNumber}: nested mappings are only supported for metadata`,
        );
        return;
      }

      const key = nested[1].trim();
      if (!key) {
        errors.push(`${displayPath(file)}:${lineNumber}: metadata field key must be nonempty`);
        return;
      }

      if (Object.prototype.hasOwnProperty.call(frontmatter.metadata, key)) {
        errors.push(`${displayPath(file)}:${lineNumber}: duplicate metadata field: ${key}`);
        return;
      }

      frontmatter.metadata[key] = unquoteScalar(nested[2].trim());
      return;
    }

    if (/^\s/.test(line)) {
      errors.push(`${displayPath(file)}:${lineNumber}: unsupported frontmatter indentation`);
      return;
    }

    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!field) {
      errors.push(`${displayPath(file)}:${lineNumber}: unsupported frontmatter syntax`);
      activeMap = null;
      return;
    }

    const key = field[1];
    const value = field[2].trim();
    activeMap = null;

    if (!KNOWN_FIELDS.has(key)) {
      errors.push(`${displayPath(file)}:${lineNumber}: unsupported frontmatter field: ${key}`);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(frontmatter, key)) {
      errors.push(`${displayPath(file)}:${lineNumber}: duplicate frontmatter field: ${key}`);
      return;
    }

    if (key === "metadata") {
      if (value) {
        errors.push(`${displayPath(file)}:${lineNumber}: metadata must be a block mapping`);
        return;
      }

      frontmatter.metadata = {};
      activeMap = "metadata";
      return;
    }

    frontmatter[key] = unquoteScalar(value);
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

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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
    console.error(`[agentskills-validator] ${message}`);
  }
  process.exit(1);
}
