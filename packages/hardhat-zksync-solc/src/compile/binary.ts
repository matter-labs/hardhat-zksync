import { exec } from 'child_process';
import semver from 'semver';
import { ZkSolcConfig } from '../types';
import { ZKSOLC_COMPILER_MIN_VERSION_WITH_MANDATORY_CODEGEN } from '../constants';

export async function compileWithBinary(
    input: any,
    config: ZkSolcConfig,
    solcPath: string,
    detectMissingLibrariesMode: boolean = false,
): Promise<any> {
    const { compilerPath } = config.settings;

    let processCommand = `${compilerPath} --standard-json --solc ${solcPath}`;

    if (semver.lt(config.version, ZKSOLC_COMPILER_MIN_VERSION_WITH_MANDATORY_CODEGEN)) {
        const { isSystem, viaEVMAssembly, viaYul } = config.settings;
        processCommand += `${detectMissingLibrariesMode ? ' --detect-missing-libraries' : ''} ${
            isSystem ? '--system-mode' : ''
        }  ${viaEVMAssembly ? '--force-evmla' : ''} ${viaYul ? '--via-ir' : ''}`;
    }

    if (detectMissingLibrariesMode && semver.gte(config.version, ZKSOLC_COMPILER_MIN_VERSION_WITH_MANDATORY_CODEGEN)) {
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
