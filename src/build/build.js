#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const ejs = require("ejs");
const { pluginTargets } = require("./plugins");

const repoRoot = path.resolve(__dirname, "../..");
const srcRoot = path.join(repoRoot, "src");
const srcSkills = path.join(srcRoot, "skills");
const srcPlugins = path.join(srcRoot, "plugins");
const srcShared = path.join(srcRoot, "shared");
const outPlugins = path.join(repoRoot, "plugins");
const sharedLicense = path.join(repoRoot, "LICENSE");
const pluginVersionsPath = path.join(repoRoot, "plugin-versions.json");

const args = new Set(process.argv.slice(2));
const checkMode = args.has("--check");
const cleanMode = args.has("--clean");

if (![...args].every((arg) => ["--check", "--clean"].includes(arg))) {
  fail(`Unknown argument. Supported arguments: --check, --clean`);
}

if (checkMode && cleanMode) {
  fail("Use either --check or --clean, not both.");
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

async function main() {
  const mode = cleanMode ? "clean" : checkMode ? "check" : "build";
  log(`Starting generated plugin ${mode}.`);
  log(`Targets: ${pluginTargets.map((target) => target.name).join(", ")}.`);

  const pluginVersions = await readPluginVersions(pluginTargets.map((target) => target.name));
  log(
    `Plugin versions: ${pluginTargets
      .map((target) => `${target.name}@${pluginVersions[target.name]}`)
      .join(", ")}.`,
  );

  if (cleanMode) {
    log("Cleaning generated plugin outputs.");
    for (const target of pluginTargets) {
      const removedEntries = await cleanOutputDirectory(path.join(outPlugins, target.name));
      log(`Cleaned plugins/${target.name}; removed ${removedEntries} generated entries.`);
    }
    log("Clean succeeded.");
    return;
  }

  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "specdd-plugins-"));
  const tempPlugins = path.join(tempDir, "plugins");
  log(`Rendering expected plugin trees in ${tempDir}.`);

  try {
    await renderPluginTrees(pluginTargets, pluginVersions, tempPlugins);

    if (checkMode) {
      log("Comparing expected plugin trees with generated plugin outputs.");
      const differences = [];
      for (const target of pluginTargets) {
        const targetDifferences = await compareTrees(
          path.join(tempPlugins, target.name),
          path.join(outPlugins, target.name),
          `plugins/${target.name}`,
        );
        differences.push(...targetDifferences);
        log(
          targetDifferences.length === 0
            ? `Checked plugins/${target.name}; output is current.`
            : `Checked plugins/${target.name}; found ${targetDifferences.length} differences.`,
        );
      }

      if (differences.length > 0) {
        differences.forEach((difference) => console.error(difference));
        throw new Error("Generated plugin outputs are stale. Run `make build`.");
      }
      log("Check succeeded. Generated plugin outputs are current.");
      return;
    }

    log("Replacing generated plugin outputs.");
    for (const target of pluginTargets) {
      const outputDir = path.join(outPlugins, target.name);
      const removedEntries = await cleanOutputDirectory(outputDir);
      log(`Cleaned plugins/${target.name}; removed ${removedEntries} generated entries.`);
      const copiedEntries = await copyTree(path.join(tempPlugins, target.name), outputDir);
      log(`Copied plugins/${target.name}; wrote ${copiedEntries} generated files.`);
    }
    log("Build succeeded. Generated plugin outputs were rebuilt.");
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
    log("Removed temporary build directory.");
  }
}

async function readPluginVersions(pluginNames) {
  const versions = JSON.parse(await fs.promises.readFile(pluginVersionsPath, "utf8"));

  for (const pluginName of pluginNames) {
    const version = versions[pluginName];
    if (!version) {
      fail(`Missing version for ${pluginName} in plugin-versions.json.`);
    }

    if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
      fail(`Invalid semver version for ${pluginName} in plugin-versions.json: ${version}`);
    }
  }

  return versions;
}

async function renderPluginTrees(targets, pluginVersions, targetRoot) {
  for (const target of targets) {
    const targetDir = path.join(targetRoot, target.name);
    log(`Rendering ${target.name} plugin.`);
    const templateData = createTemplateData(target);

    const sharedFiles = await copyIncludedFiles(
      srcShared,
      targetDir,
      target.includes.shared,
      templateData,
    );
    log(`Copied ${target.name} shared includes: ${sharedFiles} files.`);

    if (fs.existsSync(sharedLicense)) {
      await fs.promises.mkdir(targetDir, { recursive: true });
      await fs.promises.copyFile(sharedLicense, path.join(targetDir, "LICENSE"));
      log(`Copied ${target.name} shared license.`);
    }

    const pluginFiles = await copyIncludedFiles(
      path.join(srcPlugins, target.name),
      targetDir,
      target.includes.plugin,
      templateData,
    );
    log(`Copied ${target.name} plugin includes: ${pluginFiles} files.`);
    if (target.manifest) {
      await setManifestVersion(targetDir, target.manifest, pluginVersions[target.name]);
      log(`Set ${target.name} manifest version to ${pluginVersions[target.name]}.`);
    } else {
      log(`Skipped ${target.name} manifest version; target has no manifest.`);
    }
    const renderedSkills = await renderSkills(
      target,
      path.join(targetDir, "skills"),
      templateData,
    );
    log(`Rendered ${target.name} skills: ${renderedSkills} skills.`);
    log(`Rendered ${target.name} plugin successfully.`);
  }
}

function createTemplateData(target) {
  return {
    repoRoot,
    srcRoot,
    target,
    agentName: target.agentName,
  };
}

async function setManifestVersion(targetDir, manifestRelativePath, version) {
  const manifestPath = path.join(targetDir, manifestRelativePath);
  const manifest = JSON.parse(await fs.promises.readFile(manifestPath, "utf8"));
  manifest.version = version;
  await writeText(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function renderSkills(target, targetSkillsDir, templateData) {
  const skillEntries = await fs.promises.readdir(srcSkills, { withFileTypes: true });
  skillEntries.sort((left, right) => left.name.localeCompare(right.name));
  let renderedSkills = 0;

  for (const entry of skillEntries) {
    if (!entry.isDirectory()) {
      continue;
    }

    await copyIncludedFiles(
      path.join(srcSkills, entry.name),
      path.join(targetSkillsDir, entry.name),
      target.includes.skills,
      templateData,
    );
    renderedSkills += 1;
  }

  return renderedSkills;
}

async function copyIncludedFiles(sourceDir, targetDir, includes, templateData) {
  let copiedFiles = 0;

  for (const includePath of includes) {
    const sourcePath = path.join(sourceDir, includePath);
    const targetName = includePath.endsWith(".ejs") ? includePath.slice(0, -4) : includePath;
    const targetPath = path.join(targetDir, targetName);

    await copyOrRenderFile(sourcePath, targetPath, templateData);
    copiedFiles += 1;
  }

  return copiedFiles;
}

async function copyOrRenderFile(sourcePath, targetPath, templateData) {
  await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });

  if (sourcePath.endsWith(".ejs")) {
    const rendered = await ejs.renderFile(
      sourcePath,
      templateData,
      {
        root: srcRoot,
        views: [srcRoot],
        filename: sourcePath,
      },
    );
    await writeText(targetPath, ensureTrailingNewline(rendered));
    return;
  }

  await fs.promises.copyFile(sourcePath, targetPath);
}

async function copyTree(sourceDir, targetDir) {
  const entries = await fs.promises.readdir(sourceDir, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  await fs.promises.mkdir(targetDir, { recursive: true });
  let copiedFiles = 0;

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copiedFiles += await copyTree(sourcePath, targetPath);
    } else if (entry.isFile() && !entry.name.endsWith(".sdd")) {
      await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.promises.copyFile(sourcePath, targetPath);
      copiedFiles += 1;
    }
  }

  return copiedFiles;
}

async function cleanOutputDirectory(outputDir) {
  await fs.promises.mkdir(outputDir, { recursive: true });
  const entries = await fs.promises.readdir(outputDir, { withFileTypes: true });
  let removedEntries = 0;

  for (const entry of entries) {
    if (entry.name === ".git") {
      continue;
    }

    await fs.promises.rm(path.join(outputDir, entry.name), {
      recursive: true,
      force: true,
    });
    removedEntries += 1;
  }

  return removedEntries;
}

async function compareTrees(expectedDir, actualDir, label) {
  const expectedFiles = await listFiles(expectedDir);
  const actualFiles = await listFiles(actualDir);
  const differences = [];
  const allFiles = Array.from(new Set([...expectedFiles.keys(), ...actualFiles.keys()])).sort();

  for (const relativePath of allFiles) {
    const expectedPath = expectedFiles.get(relativePath);
    const actualPath = actualFiles.get(relativePath);

    if (!expectedPath) {
      differences.push(`Unexpected generated file: ${label}/${relativePath}`);
      continue;
    }

    if (!actualPath) {
      differences.push(`Missing generated file: ${label}/${relativePath}`);
      continue;
    }

    const [expectedHash, actualHash] = await Promise.all([
      hashFile(expectedPath),
      hashFile(actualPath),
    ]);

    if (expectedHash !== actualHash) {
      differences.push(`Changed generated file: ${label}/${relativePath}`);
    }
  }

  return differences;
}

async function listFiles(rootDir) {
  const files = new Map();

  if (!fs.existsSync(rootDir)) {
    return files;
  }

  await walk(rootDir);
  return files;

  async function walk(currentDir) {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      if (entry.name === ".git") {
        continue;
      }

      const entryPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(entryPath);
      } else if (entry.isFile()) {
        files.set(path.relative(rootDir, entryPath), entryPath);
      }
    }
  }
}

async function hashFile(filePath) {
  const content = await fs.promises.readFile(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function writeText(filePath, content) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, content, "utf8");
}

function ensureTrailingNewline(content) {
  return content.endsWith("\n") ? content : `${content}\n`;
}

function log(message) {
  console.log(`[build] ${message}`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
