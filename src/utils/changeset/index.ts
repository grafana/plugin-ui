#!/usr/bin/env node

import { fork } from "node:child_process";
import { rm, rename, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import prompts from "prompts";
import getChangesets from "@changesets/read";
import writeChangesets from "@changesets/write";
import { glob } from "fast-glob";

const changeTypes = {
  feature: { icon: "🚀", prefix: "Feature" },
  fix: { icon: "🐛", prefix: "Fix" },
  docs: { icon: "📝", prefix: "Documentation" },
  chore: { icon: "⚙️", prefix: "Chore" },
  tests: { icon: "🧪", prefix: "Tests" },
  refactor: { icon: "⚙️", prefix: "Chore" },
};
const dir = process.cwd();

// First two arguments are `ts-node` and this file name.
// Actual changeset arguments start from the 3rd item.
const args = process.argv.slice(2);

(async () => {
  if (args[0] === "version") {
    // If this is a version change we only need to update CHANGELOG.md
    await runChangesetCmd(args);
    updateChangelogFiles();
    return;
  }

  const changeSetIdsBefore = (await getChangesets(dir)).map((c) => c.id);

  await runChangesetCmd(args);

  const changeSetsAfter = await getChangesets(dir);

  if (changeSetsAfter.length <= changeSetIdsBefore.length) {
    // There are no new changes, no need to continue
    return;
  }

  // Asking what's the change type
  const { changeType } = await prompts({
    name: "changeType",
    type: "select",
    message: "What kind of change have you added?",
    choices: Object.entries(changeTypes).map(([key, { icon }]) => ({
      title: `${icon} ${key}`,
      value: key,
    })),
  });
  const { icon, prefix } = changeTypes[changeType as keyof typeof changeTypes];

  // Adding change type to the changeset summary
  const newChangeset = changeSetsAfter
    .filter((change) => !changeSetIdsBefore.includes(change.id))
    .map((changeset) => ({
      ...changeset,
      summary: `${icon} **${prefix}**: ${changeset.summary}`,
    }))[0];

  // Remove the original changeset file
  await rm(join(dir, ".changeset", `${newChangeset.id}.md`));

  // Write a new changeset file (includes change type), returns the new id
  const id = await writeChangesets(newChangeset, dir);

  // Rename new file to previous name
  await rename(
    join(dir, ".changeset", `${id}.md`),
    join(dir, ".changeset", `${newChangeset.id}.md`)
  );
})();

function runChangesetCmd(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = fork(join(dir, "node_modules/.bin/changeset"), args);
    child.on("error", reject);
    child.on("close", (exitCode) => {
      if (exitCode === 0) {
        resolve();
      } else {
        reject(
          new Error(`Changeset process exited with exit code ${exitCode}`)
        );
      }
    });
  });
}

async function updateChangelogFiles() {
  const packageJson = JSON.parse(
    await readFile(join(dir, "package.json"), {
      encoding: "utf-8",
    })
  ) as { workspaces?: string[] };

  const packageRoots: string[] = packageJson.workspaces
    ? await glob(packageJson.workspaces, { onlyDirectories: true })
    : [dir];

  for (const rootDir of packageRoots) {
    const filePath = join(rootDir, "CHANGELOG.md");
    const content = await readFile(filePath, { encoding: "utf-8" });
    const today = new Date();
    const date = `0${today.getDate()}`.slice(-2);
    const month = `0${today.getMonth() + 1}`.slice(-2);
    const year = today.getFullYear();
    const formattedDate = `${year}-${month}-${date}`;
    const updatedChangeLog = content
      // Remove unnecessary titles
      .replace(/\s### (Patch|Minor|Major) Changes\s+/gi, "")
      // Add `v` prefix to the version and add date
      .replace(/## (\d+\.\d+.\d+)\s+/, `## v$1 - ${formattedDate}\n\n`);

    await writeFile(filePath, updatedChangeLog);
  }
}
