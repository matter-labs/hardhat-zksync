import 'hardhat/types/runtime';
import { DefenderHardhatUpgrades, HardhatUpgrades, HardhatZksyncUpgrades } from './interfaces';

declare module 'hardhat/types/runtime' {
    export interface HardhatRuntimeEnvironment {
        zkUpgrades: HardhatZksyncUpgrades;
        upgrades: HardhatZksyncUpgrades & HardhatUpgrades;
        defender: DefenderHardhatUpgrades | undefined;
    }
}
