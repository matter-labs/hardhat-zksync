import 'hardhat/types/runtime';
import { HardhatUpgrades } from './interfaces';
import {
    HardhatPlatformConfig,
    HardhatUpgradesOZ,
    PlatformHardhatUpgradesOZ,
} from './openzeppelin-hardhat-upgrades/interfaces';

declare module 'hardhat/types/runtime' {
    export interface HardhatRuntimeEnvironment {
        zkUpgrades: HardhatUpgrades;
        upgrades: HardhatUpgrades & HardhatUpgradesOZ;
        platform: PlatformHardhatUpgradesOZ;
    }
}

declare module 'hardhat/types/config' {
    export interface HardhatUserConfig {
        platform?: HardhatPlatformConfig;
    }

    export interface HardhatConfig {
        platform?: HardhatPlatformConfig;
    }
}
