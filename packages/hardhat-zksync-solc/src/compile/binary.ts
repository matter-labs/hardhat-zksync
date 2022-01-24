import { exec, spawnSync } from 'child_process';
import { ZkSolcConfig } from '../types';
import { pluginError } from '../utils';

// Checks whether `zksolc` is available in `$PATH`.
export function checkZksolcBinary() {
    const inPath = spawnSync('which', ['zksolc']).status === 0;
    if (!inPath) {
        throw pluginError('`zksolc` binary is either not installed or not in $PATH');
    }
}

export async function compileWithBinary(input: any, config: ZkSolcConfig): Promise<any> {
    const output: string = await new Promise((resolve, reject) => {
        const process = exec(
            `zksolc --standard-json ${config?.settings?.optimizer?.enabled ? '--optimize' : ''}`,
            {
                maxBuffer: 1024 * 1024 * 500,
            },
            (err, stdout, _stderr) => {
                if (err !== null) {
                    return reject(err);
                }
                resolve(stdout);
            }
        );

        process.stdin!.write(JSON.stringify(input));
        process.stdin!.end();
    });

    return JSON.parse(output);
}
