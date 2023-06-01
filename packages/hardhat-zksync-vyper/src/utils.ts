import { NomicLabsHardhatPluginError } from 'hardhat/plugins';
import { getCompilersDir } from 'hardhat/internal/util/global-dir';
import path from 'path';

export function zeroxlify(hex: string): string {
    hex = hex.toLowerCase();
    return hex.slice(0, 2) === '0x' ? hex : `0x${hex}`;
}

// Returns a built plugin exception object.
export function pluginError(message: string, parent?: any): NomicLabsHardhatPluginError {
    return new NomicLabsHardhatPluginError('@matterlabs/hardhat-zksync-vyper', message, parent);
}

export async function getZkvyperPath(version: string): Promise<string> {
    return path.join(await getCompilersDir(), 'zkvyper', `zkvyper-v${version}`);
}

export function getZkvyperUrl(version: string): string {
    // @ts-ignore
    const platform = { darwin: 'macosx', linux: 'linux', win32: 'windows' }[process.platform];
    // @ts-ignore
    const toolchain = { linux: '-musl', win32: '-gnu', darwin: '' }[process.platform];
    const arch = process.arch == 'x64' ? 'amd64' : process.arch;
    const ext = process.platform == 'win32' ? '.exe' : '';
    return `https://github.com/matter-labs/zkvyper-bin/raw/main/${platform}-${arch}/zkvyper-${platform}-${arch}${toolchain}-v${version}${ext}`;
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
