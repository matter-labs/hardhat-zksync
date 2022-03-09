import { existsSync } from 'fs';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as path from 'path';
import * as glob from 'glob';

import { pluginError } from './helpers';

export function findDeployScripts(hre: HardhatRuntimeEnvironment): string[] {
    const workDir = hre.config.paths.root;
    const deployScriptsDir = path.join(workDir, 'deploy');

    if (!existsSync(deployScriptsDir)) {
        throw pluginError('No deploy folder was found');
    }

    const tsFiles = glob.sync(path.join(deployScriptsDir, '**', '*.ts'));
    const jsFiles = glob.sync(path.join(deployScriptsDir, '**', '*.js'));
    const files = tsFiles.concat(jsFiles);
    files.sort();

    return files;
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
    if (deployFn.default) {
        deployFn = deployFn.default;
    }

    await deployFn(hre);
}
