#!/usr/bin/env node

const fse = require("fs-extra");
const yargs = require("yargs");
const spawn = require("child_process").spawnSync;
const chalk = require("chalk");

const argv = yargs
  .usage(
    "Usage: ./test.js [--packages=hardhat-zksync-deploy hardhat-zksync-solc] [--examples=basic-example node-example] [--commands=test compile deploy]",
  )
  .option("packages", { type: "array" })
  .option("examples", { type: "array" })
  .option("commands", { type: "array" })
  .help().argv;

const packagePath = "../.././packages/";
const examplePath = "../.././examples/";

const commandActions = {
  test: "yarn test",
  compile: "yarn hardhat compile",
  deploy: "yarn hardhat deploy-zksync",
  //'scripts': 'yarn hardhat run scripts/*'
};

const spawnConsole = { stdio: "inherit", shell: true };

const commands = argv.commands
  ? argv.commands
  : ["test", "compile", "deploy", "scripts"];
const packages = argv.packages
  ? argv.packages.map((p) => `${packagePath}${p}/`)
  : undefined;
const examples = argv.examples
  ? argv.examples.map((e) => `${examplePath}${e}/`)
  : undefined;

(async () => {
  let directories = await getAllDirectories();

  await Promise.all(directories).then(async (directories) => {
    await directories.forEach(async (dir) => {
      console.log(chalk.magenta("Folder: ") + chalk.green(dir));
      runAllSh(commands, dir);
    });
  });
})().then(() => console.log(chalk.cyan("Finished!")));

function runAllSh(tests, dir) {
  tests.forEach((element) => {
    let command = commandActions[element];
    if (command) {
      console.log(chalk.yellow("Command: ") + chalk.green(command));
      spawn(`cd ${dir} && ${command}`, spawnConsole);
    }
  });
}

async function getAllDirectories() {
  let directories = [];

  if (packages || examples) {
    directories = directories.concat(packages);
    directories = directories.concat(examples);
    return directories;
  }

  directories = directories.concat(await getDirectories(examplePath));
  directories = directories.concat(await getDirectories(packagePath));
  return directories.flat();
}

async function getDirectories(path) {
  let filesAndDirectories = await fse.readdir(path);

  let directories = [];
  await Promise.all(
    filesAndDirectories.map((name) => {
      return fse.stat(path + name).then((stat) => {
        if (stat.isDirectory()) directories.push(path + name);
      });
    }),
  );
  return directories;
}
