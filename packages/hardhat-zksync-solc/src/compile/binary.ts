import { exec } from 'child_process';
import { ZkSolcConfig } from '../types';
import { getZksolcPath } from '../utils';

export async function compileWithBinary(input: any, config: ZkSolcConfig, solcPath: string): Promise<any> {
    const compilerPath = config.settings.compilerPath || (await getZksolcPath(config.version));
    const isSystem = config.settings.isSystem;
    const forceEvmla = config.settings.forceEvmla;
    const output: string = await new Promise((resolve, reject) => {
        const process = exec(
            `${compilerPath} --standard-json  ${isSystem ? '--system-mode' : ''} ${forceEvmla ? '--force-evmla' : ''} --solc ${solcPath}`,
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
