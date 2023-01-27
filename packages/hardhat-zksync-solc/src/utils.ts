import { getCompilersDir } from 'hardhat/internal/util/global-dir';
import path from 'path';
import { SUPPORTED_ZKSOLC_OUTPUT_SELECTIONS } from './constants';
import { CompilerOutputSelection } from './types';
import crypto from 'crypto';

export function filterSupportedOutputSelections(outputSelection: CompilerOutputSelection): CompilerOutputSelection {
    const filteredOutputSelection: CompilerOutputSelection = {};

    for (const [file, contractSelection] of Object.entries(outputSelection)) {
        filteredOutputSelection[file] = {};

        for (const [contract, outputs] of Object.entries(contractSelection)) {
            filteredOutputSelection[file][contract] = outputs.filter((output) =>
                SUPPORTED_ZKSOLC_OUTPUT_SELECTIONS.includes(output)
            );
        }
    }

    return filteredOutputSelection;
}

export function zeroxlify(hex: string): string {
    hex = hex.toLowerCase();
    return hex.slice(0, 2) === '0x' ? hex : `0x${hex}`;
}

export async function getZksolcPath(version: string, salt: string = ''): Promise<string> {
    return path.join(await getCompilersDir(), 'zksolc', `zksolc-v${version}${salt ? '-' : ''}${salt}`);
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

export function getZksolcUrl(repo: string, version: string): string {
    // @ts-ignore
    const platform = { darwin: 'macosx', linux: 'linux', win32: 'windows' }[process.platform];
    // @ts-ignore
    const toolchain = { linux: '-musl', win32: '-gnu', darwin: '' }[process.platform];
    const arch = process.arch == 'x64' ? 'amd64' : process.arch;
    const ext = process.platform == 'win32' ? '.exe' : '';
    return `${repo}/raw/main/${platform}-${arch}/zksolc-${platform}-${arch}${toolchain}-v${version}${ext}`;
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
    return [
        parseInt(versionComponents[0]),
        parseInt(versionComponents[1]),
        parseInt(versionComponents[2])
    ];
}
