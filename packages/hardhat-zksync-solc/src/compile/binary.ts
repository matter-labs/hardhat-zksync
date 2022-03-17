import { exec } from 'child_process';
import { ZkSolcConfig } from '../types';

export async function compileWithBinary(input: any, config: ZkSolcConfig, solcPath: string): Promise<any> {
    const output: string = await new Promise((resolve, reject) => {
        const process = exec(
            `${config.settings.compilerPath} --standard-json --solc ${solcPath} ${
                config.settings.optimizer?.enabled ? '--optimize' : ''
            }`,
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
