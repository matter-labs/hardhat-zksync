import 'hardhat/types/runtime';
import { HardhatZksyncUpgrades } from './interfaces';
import { DefenderHardhatUpgradesOZ, HardhatUpgradesOZ } from './openzeppelin-hardhat-upgrades/interfaces';

declare module 'hardhat/types/runtime' {
    export interface HardhatRuntimeEnvironment {
        zkUpgrades: HardhatZksyncUpgrades;
        upgrades: HardhatZksyncUpgrades & HardhatUpgradesOZ;
        defender: DefenderHardhatUpgradesOZ;
    }
}

// Openzeppelin Defender plugin
export interface HardhatDefenderConfig {
    apiKey: string;
    apiSecret: string;
    useDefenderDeploy?: boolean;
}

declare module 'hardhat/types/config' {
    export interface HardhatUserConfig {
        defender?: HardhatDefenderConfig;
    }

    export interface HardhatConfig {
        defender?: HardhatDefenderConfig;
    }
}
