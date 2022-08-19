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
    const platform = process.platform;
    const arch = process.arch == 'x64' ? 'amd64' : process.arch;
    return `https://github.com/matter-labs/zkvyper-bin/raw/main/${platform}-${arch}/zkvyper-${platform}-${arch}-musl-v${version}`;
}
