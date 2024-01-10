import { exec } from 'child_process';
import { ZkSolcConfig } from '../types';

export async function compileWithBinary(
    input: any,
    config: ZkSolcConfig,
    solcPath: string,
    detectMissingLibrariesMode: boolean = false,
): Promise<any> {
    const { compilerPath, isSystem, forceEvmla, fallbackOz } = config.settings;

    const processCommand = `${compilerPath} --standard-json ${isSystem ? '--system-mode' : ''} ${
        forceEvmla ? '--force-evmla' : ''
    } ${fallbackOz ? '--fallback-Oz' : ''} --solc ${solcPath} ${
        detectMissingLibrariesMode ? '--detect-missing-libraries' : ''
    }`;

    const output: string = await new Promise((resolve, reject) => {
        const process = exec(
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

        process.stdin!.write(JSON.stringify(input));
        process.stdin!.end();
    });

    return JSON.parse(output);
}
