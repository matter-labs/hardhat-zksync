import semver from 'semver';
import crypto from 'crypto';
import { SolcUserConfig } from 'hardhat/types';
import fse from 'fs-extra';
import lockfile from 'proper-lockfile';
import fs from 'fs';
import path from 'path';
import util from 'util';
import type { Dispatcher } from 'undici';
import chalk from 'chalk';
import { CompilerVersionInfo } from './compile/downloader';
import { CompilerOutputSelection, MissingLibrary, ZkSolcConfig } from './types';
import {
    ZKSOLC_COMPILERS_SELECTOR_MAP,
    SOLCJS_EXECUTABLE_CODE,
    DEFAULT_TIMEOUT_MILISECONDS,
    COMPILER_ZKSOLC_NEED_EVM_CODEGEN,
    ZKSOLC_COMPILER_MIN_VERSION_BREAKABLE_CHANGE,
    ZKSOLC_COMPILER_VERSION_MIN_VERSION_WITH_ZKVM_COMPILER,
    COMPILER_ZKSOLC_VERSION_WITH_ZKVM_SOLC_WARN,
    ZKSOLC_BIN_OWNER,
    ZKVM_SOLC_BIN_REPOSITORY_NAME,
    USER_AGENT,
    COMPILER_ZKSOLC_IS_SYSTEM_USE,
    COMPILER_ZKSOLC_FORCE_EVMLA_USE,
    COMPILER_MIN_LINUX_VERSION_WITH_GNU_TOOLCHAIN,
    fallbackLatestEraCompilerVersion,
} from './constants';
import { ZkSyncSolcPluginError } from './errors';
import {
    CompilerSolcUserConfigUpdater,
    OverrideCompilerSolcUserConfigUpdater,
    SolcConfigData,
    SolcUserConfigUpdater,
} from './config-update';

const TEMP_FILE_PREFIX = 'tmp-';

export function filterSupportedOutputSelections(
    outputSelection: CompilerOutputSelection,
    zkCompilerVersion: string,
): CompilerOutputSelection {
    const filteredOutputSelection: CompilerOutputSelection = {};
    const versionComponents = getVersionComponents(zkCompilerVersion);
    let supportedOutputSelections: string[];

    switch (true) {
        case versionComponents[0] <= 1 && versionComponents[1] <= 3 && versionComponents[2] <= 5:
            supportedOutputSelections = ZKSOLC_COMPILERS_SELECTOR_MAP['1.3.5'];
            break;
        default:
            supportedOutputSelections = [...ZKSOLC_COMPILERS_SELECTOR_MAP['1.3.5'], 'metadata', 'userdoc', 'devdoc'];
            break;
    }

    for (const [file, contractSelection] of Object.entries(outputSelection)) {
        filteredOutputSelection[file] = {};

        for (const [contract, outputs] of Object.entries(contractSelection)) {
            filteredOutputSelection[file][contract] = outputs.filter((output) =>
                supportedOutputSelections.includes(output),
            );
        }
    }

    return filteredOutputSelection;
}

export function updateDefaultCompilerConfig(solcConfigData: SolcConfigData, zksolc: ZkSolcConfig) {
    const compiler = solcConfigData.compiler;

    const settings = compiler.settings || {};

    // Override the default solc optimizer settings with zksolc optimizer settings.
    compiler.settings = { ...settings, optimizer: { ...zksolc.settings.optimizer } };

    zksolc.settings.enableEraVMExtensions = zksolc.settings.enableEraVMExtensions || zksolc.settings.isSystem || false;
    zksolc.settings.forceEVMLA = zksolc.settings.forceEVMLA || zksolc.settings.forceEvmla || false;

    if (zksolc.settings.isSystem !== undefined) {
        console.warn(chalk.blue(COMPILER_ZKSOLC_IS_SYSTEM_USE));
        delete zksolc.settings.isSystem;
    }

    if (zksolc.settings.forceEvmla !== undefined) {
        console.warn(chalk.blue(COMPILER_ZKSOLC_FORCE_EVMLA_USE));
        delete zksolc.settings.forceEvmla;
    }

    const [major, minor] = getVersionComponents(compiler.version);
    if (major === 0 && minor < 8) {
        console.warn(chalk.blue(COMPILER_ZKSOLC_NEED_EVM_CODEGEN));
        compiler.settings.forceEVMLA = true;
    }

    // Remove metadata settings from solidity settings.
    delete compiler.settings.metadata;
    // Override the solc metadata settings with zksolc metadata settings.
    if (zksolc.settings.metadata) {
        compiler.settings.metadata = { ...zksolc.settings.metadata };
    }

    // zkSolc supports only a subset of solc output selections
    compiler.settings.outputSelection = filterSupportedOutputSelections(
        compiler.settings.outputSelection,
        zksolc.version,
    );
}

const solcUpdaters: SolcUserConfigUpdater[] = [
    new OverrideCompilerSolcUserConfigUpdater(),
    new CompilerSolcUserConfigUpdater(),
];

export function updateBreakableCompilerConfig(
    solcConfigData: SolcConfigData,
    zksolc: ZkSolcConfig,
    latestEraVersion: string,
    userConfigCompilers: SolcUserConfig[] | Map<string, SolcUserConfig>,
) {
    const compiler = solcConfigData.compiler;

    if (isBreakableCompilerVersion(zksolc.version)) {
        compiler.settings.detectMissingLibraries = false;
        compiler.settings.forceEVMLA = zksolc.settings.forceEVMLA;
        compiler.settings.enableEraVMExtensions = zksolc.settings.enableEraVMExtensions;
    }

    solcUpdaters
        .find((updater) => updater.suituble(userConfigCompilers, solcConfigData.file))
        ?.update(compiler, latestEraVersion, zksolc, userConfigCompilers, solcConfigData.file);

    if (
        zksolc.version !== 'latest' &&
        compiler.eraVersion &&
        semver.lt(zksolc.version, ZKSOLC_COMPILER_VERSION_MIN_VERSION_WITH_ZKVM_COMPILER)
    ) {
        console.warn(chalk.blue(COMPILER_ZKSOLC_VERSION_WITH_ZKVM_SOLC_WARN));
        compiler.eraVersion = undefined;
    }
}

export function isBreakableCompilerVersion(zksolcVersion: string): boolean {
    return zksolcVersion === 'latest' || semver.gte(zksolcVersion, ZKSOLC_COMPILER_MIN_VERSION_BREAKABLE_CHANGE);
}

export function zeroxlify(hex: string): string {
    hex = hex.toLowerCase();
    return hex.slice(0, 2) === '0x' ? hex : `0x${hex}`;
}

export function isURL(url: string): boolean {
    try {
        const locator = new URL(url);
        return locator.protocol === 'http:' || locator.protocol === 'https:';
    } catch (e) {
        return false;
    }
}

export function sha1(str: string): string {
    return crypto.createHash('sha1').update(str).digest('hex');
}

export function saltFromUrl(url: string): string {
    return sha1(url);
}

export function getZksolcUrl(repo: string, version: string, isRelease: boolean = true): string {
    // @ts-ignore
    const platform = { darwin: 'macosx', linux: 'linux', win32: 'windows' }[process.platform];
    const toolchain = semver.lt(version, COMPILER_MIN_LINUX_VERSION_WITH_GNU_TOOLCHAIN)
        ? // @ts-ignore
          { linux: '-musl', win32: '-gnu', darwin: '' }[process.platform]
        : // @ts-ignore
          { linux: '-gnu', win32: '-gnu', darwin: '' }[process.platform];
    const arch = process.arch === 'x64' ? 'amd64' : process.arch;
    const ext = process.platform === 'win32' ? '.exe' : '';

    if (isRelease) {
        return `${repo}/releases/download/v${version}/zksolc-${platform}-${arch}${toolchain}-v${version}${ext}`;
    }

    return `${repo}/raw/main/${platform}-${arch}/zksolc-${platform}-${arch}${toolchain}-v${version}${ext}`;
}

export function getZkVmSolcUrl(repo: string, version: string, isRelease: boolean = true): string {
    // @ts-ignore
    const platform = { darwin: 'macosx', linux: 'linux', win32: 'windows' }[process.platform];
    // @ts-ignore
    const arch = process.arch === 'x64' ? 'amd64' : process.arch;
    const ext = process.platform === 'win32' ? '.exe' : '';
    if (isRelease) {
        return `${repo}/releases/download/${version}/solc-${platform}-${arch}-${version}${ext}`;
    }

    return `${repo}/raw/main/${platform}-${arch}/solc-${platform}-${arch}-${version}${ext}`;
}

export function pluralize(n: number, singular: string, plural?: string) {
    if (n === 1) {
        return singular;
    }

    if (plural !== undefined) {
        return plural;
    }

    return `${singular}s`;
}

export function getVersionComponents(version: string): number[] {
    const versionComponents = version.split('.');
    return [parseInt(versionComponents[0], 10), parseInt(versionComponents[1], 10), parseInt(versionComponents[2], 10)];
}

export function isVersionInRange(version: string, versionInfo: CompilerVersionInfo): boolean {
    const latest = versionInfo.latest;
    const minVersion = versionInfo.minVersion;

    return semver.gte(version, minVersion) && semver.lte(version, latest);
}

// Generate SolcJS executable code
export function generateSolcJSExecutableCode(solcJsPath: string, workingDir: string): string {
    return SOLCJS_EXECUTABLE_CODE.replace(/SOLCJS_PATH/g, solcJsPath).replace(/WORKING_DIR/g, workingDir);
}

// Find all the libraries that are missing from the contracts
export function findMissingLibraries(zkSolcOutput: any): Set<string> {
    const missingLibraries = new Set<string>();

    for (const filePath in zkSolcOutput.contracts) {
        if (!filePath) continue;
        for (const contractName in zkSolcOutput.contracts[filePath]) {
            if (!contractName) continue;
            const contract = zkSolcOutput.contracts[filePath][contractName];
            if (contract.missingLibraries && contract.missingLibraries.length > 0) {
                contract.missingLibraries.forEach((library: string) => {
                    missingLibraries.add(library);
                });
            }
        }
    }

    return missingLibraries;
}

export function mapMissingLibraryDependencies(zkSolcOutput: any, missingLibraries: Set<string>): MissingLibrary[] {
    const dependencyMap = new Array<MissingLibrary>();

    missingLibraries.forEach((library) => {
        const [libFilePath, libContractName] = library.split(':');
        if (zkSolcOutput.contracts[libFilePath] && zkSolcOutput.contracts[libFilePath][libContractName]) {
            const contract = zkSolcOutput.contracts[libFilePath][libContractName];
            if (contract.missingLibraries) {
                dependencyMap.push({
                    contractName: libContractName,
                    contractPath: libFilePath,
                    missingLibraries: contract.missingLibraries,
                });
            }
        }
    });

    return dependencyMap;
}

// Get or create the libraries file. If the file doesn't exist, create it with an empty array
const getOrCreateLibraries = async (filePath: string): Promise<any[]> => {
    // Ensure the file exists
    if (!(await fse.pathExists(filePath))) {
        await fse.outputFile(filePath, '[]'); // Initialize with an empty array
    }

    // Return the file's content
    return await fse.readJSON(filePath);
};

// Write missing libraries to file and lock the file while writing
export const writeLibrariesToFile = async (filePath: string, libraries: any[]): Promise<void> => {
    try {
        let existingLibraries = await getOrCreateLibraries(filePath); // Ensure that the file exists
        await lockfile.lock(filePath, { retries: { retries: 10, maxTimeout: 1000 } });

        existingLibraries = await getOrCreateLibraries(filePath); // Read again after locking
        const combinedLibraries = [...existingLibraries, ...libraries];
        fse.outputFileSync(filePath, JSON.stringify(combinedLibraries, null, 4));
    } catch (e) {
        throw new ZkSyncSolcPluginError(`Failed to write missing libraries file: ${e}`);
    } finally {
        await lockfile.unlock(filePath);
    }
};

function resolveTempFileName(filePath: string): string {
    const { dir, ext, name } = path.parse(filePath);

    return path.format({
        dir,
        ext,
        name: `${TEMP_FILE_PREFIX}${name}`,
    });
}

export async function download(
    url: string,
    filePath: string,
    userAgent: string,
    timeoutMillis = 10000,
    extraHeaders: { [name: string]: string } = {},
) {
    const { pipeline } = await import('stream');
    const { getGlobalDispatcher, request } = await import('undici');
    const streamPipeline = util.promisify(pipeline);

    const dispatcher: Dispatcher = getGlobalDispatcher();

    // Fetch the url
    const response = await request(url, {
        dispatcher,
        headersTimeout: timeoutMillis,
        maxRedirections: 10,
        method: 'GET',
        headers: {
            ...extraHeaders,
            'User-Agent': `${userAgent}`,
        },
    });

    if (response.statusCode >= 200 && response.statusCode <= 299) {
        const tmpFilePath = resolveTempFileName(filePath);
        await fse.ensureDir(path.dirname(filePath));

        await streamPipeline(response.body, fs.createWriteStream(tmpFilePath));
        return fse.move(tmpFilePath, filePath, { overwrite: true });
    }

    // undici's response bodies must always be consumed to prevent leaks
    const text = await response.body.text();

    // eslint-disable-next-line
    throw new Error(
        `Failed to download ${url} - ${response.statusCode} received. ${text}`
    );
}

export async function getLatestRelease(
    owner: string,
    repo: string,
    userAgent: string,
    defaultValue: string,
    tagPrefix: string = 'v',
    timeout: number = DEFAULT_TIMEOUT_MILISECONDS,
): Promise<any> {
    const url = `https://github.com/${owner}/${repo}/releases/latest`;
    const redirectUrlPattern = `https://github.com/${owner}/${repo}/releases/tag/${tagPrefix}`;

    const { request } = await import('undici');

    try {
        const response = await request(url, {
            headersTimeout: timeout,
            maxRedirections: 0,
            method: 'GET',
            headers: {
                'User-Agent': `${userAgent}`,
            },
        });

        // Check if the response is a redirect
        if (response.statusCode >= 300 && response.statusCode < 400) {
            // Get the URL from the 'location' header
            if (response.headers.location && typeof response.headers.location === 'string') {
                // Check if the redirect URL matches the expected pattern
                if (response.headers.location.startsWith(redirectUrlPattern)) {
                    // Extract the tag from the redirect URL
                    return response.headers.location.substring(redirectUrlPattern.length);
                }

                throw new ZkSyncSolcPluginError(
                    `Unexpected redirect URL: ${response.headers.location} for URL: ${url}`,
                );
            } else {
                // Throw an error if the 'location' header is missing in a redirect response
                throw new ZkSyncSolcPluginError(`Redirect location not found for URL: ${url}`);
            }
        } else {
            // Throw an error for non-redirect responses
            throw new ZkSyncSolcPluginError(`Unexpected response status: ${response.statusCode} for URL: ${url}`);
        }
    } catch {
        return defaultValue;
    }
}

export async function saveDataToFile(data: any, targetPath: string) {
    await fse.ensureDir(path.dirname(targetPath));
    await fse.writeJSON(targetPath, data, { spaces: 2 });
}

export function getZkVmNormalizedVersion(solcVersion: string, zkVmSolcVersion: string): string {
    return `zkVM-${solcVersion}-${zkVmSolcVersion}`;
}

export async function getLatestEraVersion(): Promise<string> {
    return (
        await getLatestRelease(
            ZKSOLC_BIN_OWNER,
            ZKVM_SOLC_BIN_REPOSITORY_NAME,
            USER_AGENT,
            fallbackLatestEraCompilerVersion,
            '',
        )
    ).split('-')[1];
}
