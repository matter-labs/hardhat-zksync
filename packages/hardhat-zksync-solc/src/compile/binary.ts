import { exec } from 'child_process';
import { LinkLibraries, ZkSolcConfig } from '../types';
import { isBreakableCompilerVersion } from '../utils';

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

    if (!isBreakableCompilerVersion(config.version)) {
        const { enableEraVMExtensions, forceEVMLA } = config.settings;
        processCommand += `${detectMissingLibrariesMode ? ' --detect-missing-libraries' : ''} ${
            enableEraVMExtensions ? '--system-mode' : ''
        }  ${forceEVMLA ? '--force-evmla' : ''}`;
    }

    if (isBreakableCompilerVersion(config.version)) {
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

export async function linkWithBinary(config: ZkSolcConfig, linkLibraries: LinkLibraries): Promise<any> {
    const { compilerPath } = config.settings;

    let processCommand = `${compilerPath} --link ${linkLibraries.contractZbinPath}`;
    if (linkLibraries.libraries) {
        processCommand += ` --libraries ${Object.entries(linkLibraries.libraries)
            .map((lib) => `${lib[0]}=${lib[1]}`)
            .join(' ')}`;
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
        process.stdin!.end();
    });
    return JSON.parse(output);
}
