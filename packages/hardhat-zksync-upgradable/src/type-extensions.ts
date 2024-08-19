import 'hardhat/types/runtime';
import { HardhatUpgrades, HardhatUpgradesOZ, PlatformHardhatUpgrades } from './interfaces';

declare module 'hardhat/types/runtime' {
    export interface HardhatRuntimeEnvironment {
        zkUpgrades: HardhatUpgrades;
        upgrades: HardhatUpgrades & HardhatUpgradesOZ;
        platform: PlatformHardhatUpgrades;
    }
}
