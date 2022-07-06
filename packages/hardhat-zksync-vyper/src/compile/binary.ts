import { exec } from 'child_process';
import { ZkVyperConfig } from '../types';

export async function compileWithBinary(inputPaths: string[], config: ZkVyperConfig, vyperPath: string): Promise<any> {
    const output: string = await new Promise((resolve, reject) => {
        const process = exec(
            `${config.settings.compilerPath} -f combined_json ${inputPaths.join(' ')} --vyper ${vyperPath}`,
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

        process.stdin!.end();
    });

    return JSON.parse(output);
}
