import { exec } from 'child_process';
import { CompilerOptions, ZkVyperConfig } from '../types';

export async function compileWithBinary(paths: CompilerOptions, config: ZkVyperConfig, vyperPath: string): Promise<any> {
    const optimizationMode = config.settings.optimizer?.mode;
    const output: string = await new Promise((resolve, reject) => {
        exec(
            `${paths.compilerPath} ${optimizationMode ? '-O ' + optimizationMode : ''} -f combined_json ${paths.inputPaths.join(' ')} --vyper ${vyperPath}`,
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
    });

    return JSON.parse(output);
}
