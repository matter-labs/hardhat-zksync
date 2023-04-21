import 'hardhat/types/runtime';
import { HardhatUpgrades } from './interfaces';

declare module 'hardhat/types/runtime' {
    export interface HardhatRuntimeEnvironment {
        zkUpgrades: HardhatUpgrades;
    }
}
