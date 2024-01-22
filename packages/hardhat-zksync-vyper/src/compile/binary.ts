import { exec } from 'child_process';
import { CompilerOptions, ZkVyperConfig } from '../types';

export async function compileWithBinary(
    paths: CompilerOptions,
    config: ZkVyperConfig,
    vyperPath: string,
): Promise<any> {
    const settings = config.settings;

    const optimizationMode = settings.optimizer?.mode;
    const fallbackOz = settings.fallbackOz;

    const processCommand = `${paths.compilerPath} ${optimizationMode ? `-O ${optimizationMode}` : ''}  ${
        fallbackOz ? '--fallback-Oz' : ''
    }  -f combined_json ${paths.inputPaths.join(' ')} --vyper ${vyperPath}`;

    const output: string = await new Promise((resolve, reject) => {
        exec(
            processCommand,
            {
                maxBuffer: 1024 * 1024 * 500,
            },
            (err, stdout, _stderr) => {
                if (err !== null) {
                    return reject(err);
                }
                resolve(stdout);
            },
        );
    });

    return JSON.parse(output);
}
