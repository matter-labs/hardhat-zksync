import { exec } from 'child_process';
import { ZkSolcConfig } from '../types';
import { needsMandatoryCodegen } from '../utils';

export async function compileWithBinary(
    input: any,
    config: ZkSolcConfig,
    solcPath: string,
    detectMissingLibrariesMode: boolean = false,
): Promise<any> {
    const { compilerPath, debugOutputDir } = config.settings;

    let processCommand = `${compilerPath} --standard-json --solc ${solcPath} ${
        debugOutputDir ? `--debug-output-dir ${debugOutputDir}` : ''
    }`;

    if (!needsMandatoryCodegen(config.version)) {
        const { enableEraVMExtensions, viaEVMAssembly } = config.settings;
        processCommand += `${detectMissingLibrariesMode ? ' --detect-missing-libraries' : ''} ${
            enableEraVMExtensions ? '--system-mode' : ''
        }  ${viaEVMAssembly ? '--force-evmla' : ''}`;
    }

    if (needsMandatoryCodegen(config.version)) {
        input.settings.detectMissingLibraries = detectMissingLibrariesMode;
    }

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
