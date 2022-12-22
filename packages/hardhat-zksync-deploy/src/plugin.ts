import { existsSync } from 'fs';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as path from 'path';
import fs from 'fs';

import { ZkSyncDeployPluginError } from './errors';

function getAllFiles(dir: string): string[] {
    const files = [];
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
        const entryPath = path.join(dir, entry);
        if (fs.lstatSync(entryPath).isDirectory()) {
            files.push(...getAllFiles(entryPath));
        } else {
            files.push(entryPath);
        }
    }
    return files;
}

export function findDeployScripts(hre: HardhatRuntimeEnvironment): string[] {
    const workDir = hre.config.paths.root;
    const deployScriptsDir = path.join(workDir, 'deploy');

    if (!existsSync(deployScriptsDir)) {
        throw new ZkSyncDeployPluginError('No deploy folder was found');
    }

    const deployScripts = getAllFiles(deployScriptsDir).filter(
        (file) => path.extname(file) == '.ts' || path.extname(file) == '.js'
    );

    return deployScripts;
}

export async function callDeployScripts(hre: HardhatRuntimeEnvironment, targetScript: string) {
    const scripts = findDeployScripts(hre);

    if (targetScript == '') {
        // Target script not specified, run everything.
        for (const script of scripts) {
            await runScript(hre, script);
        }
    } else {
        // TODO: Not efficient.
        let found = false;
        for (const script of scripts) {
            if (script.includes(targetScript)) {
                await runScript(hre, script);
                found = true;
                break;
            }
        }
        if (!found) {
            console.error(`Script ${targetScript} was not found, no scripts were run`);
        }
    }
}

async function runScript(hre: HardhatRuntimeEnvironment, script: string) {
    delete require.cache[script];
    let deployFn: any = require(script);

    if (typeof deployFn.default === 'function') {
        deployFn = deployFn.default;
    }

    if (typeof deployFn !== 'function') {
        throw new ZkSyncDeployPluginError('Deploy function does not exist or exported invalidly');
    }

    await deployFn(hre);
}
