// const path = require('path');
// process.chdir(path.join(__dirname)); 

const hre = require("hardhat");
const TASK_NODE_ZKSYNC = 'node-zksync'; // This constant can be imported or directly defined here

async function runTask(taskName) {
    await hre.run(taskName);
}

const taskName = process.argv[2] || TASK_NODE_ZKSYNC;

runTask(taskName);