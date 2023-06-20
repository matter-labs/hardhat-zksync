import semver from 'semver';

import { MultiVyperConfig } from '@nomiclabs/hardhat-vyper/dist/src/types';

import { CompilerVersionInfo } from './compile/downloader';
import { UNSUPPORTED_VYPER_VERSIONS, VYPER_VERSION_ERROR } from './constants';
import { ZkSyncVyperPluginError } from './errors';

export function zeroxlify(hex: string): string {
    hex = hex.toLowerCase();
    return hex.slice(0, 2) === '0x' ? hex : `0x${hex}`;
}

export function getZkvyperUrl(repo: string, version: string): string {
    // @ts-ignore
    const platform = { darwin: 'macosx', linux: 'linux', win32: 'windows' }[process.platform];
    // @ts-ignore
    const toolchain = { linux: '-musl', win32: '-gnu', darwin: '' }[process.platform];
    const arch = process.arch == 'x64' ? 'amd64' : process.arch;
    const ext = process.platform == 'win32' ? '.exe' : '';
    return `${repo}/raw/main/${platform}-${arch}/zkvyper-${platform}-${arch}${toolchain}-v${version}${ext}`;
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

export function isURL(url: string): boolean {
    try {
        const locator = new URL(url);
        return locator.protocol === 'http:' || locator.protocol === 'https:';
    } catch (e) {
        return false;
    }
}

export function isVersionInRange(version: string, versionInfo: CompilerVersionInfo): boolean {
    const latest = versionInfo.latest;
    const minVersion = versionInfo.minVersion;

    return semver.gte(version, minVersion) && semver.lte(version, latest);
}

export function checkSupportedVyperVersions(vyper: MultiVyperConfig) {
    vyper.compilers.forEach((compiler) => {
        if (UNSUPPORTED_VYPER_VERSIONS.includes(compiler.version)) {
            throw new ZkSyncVyperPluginError(VYPER_VERSION_ERROR);
        }
    });
}
