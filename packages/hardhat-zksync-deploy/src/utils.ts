import { HardhatRuntimeEnvironment, HttpNetworkConfig, NetworkConfig } from 'hardhat/types';
import { ContractInfo } from './types';
import { MorphTsBuilder } from './morph-ts-builder';

export function isHttpNetworkConfig(networkConfig: NetworkConfig): networkConfig is HttpNetworkConfig {
    return 'url' in networkConfig;
}

export function updateHardhatConfigFile(hre: HardhatRuntimeEnvironment, libraries: ContractInfo[], exportedConfigName: string) {
    new MorphTsBuilder(hre.config.paths.configFile)
        .intialStep(exportedConfigName)
        .nextStep({propertyName: 'zksolc', isRequired: true})
        .nextStep({ propertyName: 'settings'})
        .replaceStep({ propertyName: 'libraries', replaceObject: hre.config.zksolc.settings.libraries})
        .save();
}

