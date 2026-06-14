const { execFileSync } = require("child_process");

function hasFlag(name) {
  return process.argv.includes(name);
}

function getOption(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function run(command, args) {
  console.log(`> ${[command, ...args].join(" ")}`);
  execFileSync(command, args, { stdio: "inherit" });
}

function output(command, args) {
  return execFileSync(command, args, { encoding: "utf8" }).trim();
}

function main() {
  const noGit = hasFlag("--no-git");
  const noPush = hasFlag("--no-push");
  const message = getOption("--message", "Publish AI Native Growth issue");

  run("node", ["scripts/import-news.js"]);
  run("node", ["generate.js"]);

  if (noGit) {
    console.log("Skipped git commit and push because --no-git was provided.");
    return;
  }

  const statusBeforeAdd = output("git", ["status", "--porcelain"]);
  if (!statusBeforeAdd) {
    console.log("No changes to publish.");
    if (!noPush) run("git", ["push"]);
    return;
  }

  run("git", ["add", "content/inbox.md", "content/articles.json", "index.html", "assets"]);

  const staged = output("git", ["diff", "--cached", "--name-only"]);
  if (!staged) {
    console.log("No staged changes to commit.");
  } else {
    run("git", ["commit", "-m", message]);
  }

  if (!noPush) {
    run("git", ["push"]);
  } else {
    console.log("Skipped git push because --no-push was provided.");
  }
}

main();
