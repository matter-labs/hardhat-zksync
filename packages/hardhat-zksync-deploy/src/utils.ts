import { HardhatRuntimeEnvironment, HttpNetworkConfig, NetworkConfig } from 'hardhat/types';
import { ContractInfo } from './types';
import { MorphTsBuilder } from './morph-ts-builder';

export function isHttpNetworkConfig(networkConfig: NetworkConfig): networkConfig is HttpNetworkConfig {
    return 'url' in networkConfig;
}

export function updateHardhatConfigFile(hre: HardhatRuntimeEnvironment, libraries: ContractInfo[], exportedConfigName: string) {
    const libraryValues = generateHardhatConfigLibraries(libraries);

    new MorphTsBuilder(hre.config.paths.configFile)
        .intialStep(exportedConfigName)
        .nextStep({propertyName: 'zksolc', isRequired: true})
        .nextStep({ propertyName: 'settings'})
        .replaceStep({ propertyName: 'libraries', replaceObject: libraryValues })
        .save();
}

function generateHardhatConfigLibraries(libraries: ContractInfo[]): HardhatConfigLibraries {
    const librarySettings: HardhatConfigLibraries = {};

    libraries.forEach((library) => {
        librarySettings[library.contractName] = { [library.cleanContractName]: library.adress };
    });

    return librarySettings;
}

interface HardhatConfigLibraries {
    [contractName: string]: {
        [libraryName: string]: string;
    }
}

