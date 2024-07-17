import { HardhatRuntimeEnvironment } from 'hardhat/types';
import path from 'path';
import fse from 'fs-extra';

export const LIBRARIES_PATH: string = 'libraries-zk';
export const CHAIN_ID_FILE: string = '.chainId';
export const LIBRARIES_FILE_NAME: string = 'libraries.json';

export interface Libraries {
    [contractPath: string]: {
        [contractName: string]: string;
    };
}

export async function saveLibraries(hre: HardhatRuntimeEnvironment): Promise<void> {
    const baseDir = path.join(hre.config.paths.root, LIBRARIES_PATH, hre.network.name);
    fse.mkdirpSync(baseDir);

    const chainId = await hre.network.provider.send('eth_chainId');

    const chainIdFile = path.join(baseDir, CHAIN_ID_FILE);
    fse.writeFileSync(chainIdFile, chainId);

    const librariesFile = path.join(baseDir, LIBRARIES_FILE_NAME);
    fse.writeJsonSync(librariesFile, hre.config.zksolc.settings.libraries, { spaces: 2 });
}

export async function loadLibraries(hre: HardhatRuntimeEnvironment): Promise<Libraries | undefined> {
    const baseDir = path.join(hre.config.paths.root, LIBRARIES_PATH, hre.network.name);

    const librariesFile = path.join(baseDir, LIBRARIES_FILE_NAME);

    if (!fse.existsSync(librariesFile)) {
        return undefined;
    }

    const chainIdFile = path.join(baseDir, CHAIN_ID_FILE);
    const chainId = fse.readFileSync(chainIdFile, 'utf8');

    const currentChainId = await hre.network.provider.send('eth_chainId');

    if (chainId !== currentChainId) {
        return undefined;
    }

    const libraries: Libraries = fse.readJsonSync(librariesFile);

    return libraries;
}
