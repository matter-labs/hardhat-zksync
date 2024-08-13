import 'hardhat/types/runtime';
import { DefenderHardhatUpgradesOZ, HardhatUpgradesOZ, HardhatZksyncUpgrades } from './interfaces';

declare module 'hardhat/types/runtime' {
    export interface HardhatRuntimeEnvironment {
        zkUpgrades: HardhatZksyncUpgrades;
        upgrades: HardhatZksyncUpgrades & HardhatUpgradesOZ;
        defender: DefenderHardhatUpgradesOZ;
    }
}
