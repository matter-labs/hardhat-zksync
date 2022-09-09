import { NomicLabsHardhatPluginError } from 'hardhat/plugins';
import { getCompilersDir } from 'hardhat/internal/util/global-dir';
import path from 'path';

export function zeroxlify(hex: string): string {
    hex = hex.toLowerCase();
    return hex.slice(0, 2) === '0x' ? hex : `0x${hex}`;
}

// Returns a built plugin exception object.
export function pluginError(message: string, parent?: any): NomicLabsHardhatPluginError {
    return new NomicLabsHardhatPluginError('@matterlabs/hardhat-zksync-solc', message, parent);
}

export async function getZksolcPath(version: string): Promise<string> {
    return path.join(await getCompilersDir(), 'zksolc', `zksolc-v${version}`);
}

export function getZksolcUrl(version: string): string {
    const platform = process.platform == 'darwin' ? 'macosx' : process.platform;
    const arch = process.arch == 'x64' ? 'amd64' : process.arch;
    const musl = platform == 'linux' ? '-musl' : '';
    return `https://github.com/matter-labs/zksolc-bin/raw/main/${platform}-${arch}/zksolc-${platform}-${arch}${musl}-v${version}`;
}
