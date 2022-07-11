import { exec } from 'child_process';
import { CompilerOptions } from '../types';

export async function compileWithBinary(paths: CompilerOptions, vyperPath: string): Promise<any> {
    const output: string = await new Promise((resolve, reject) => {
        const process = exec(
            `${paths.compilerPath} -f combined_json ${paths.inputPaths.join(' ')} --vyper ${vyperPath}`,
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
