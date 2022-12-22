import '@nomiclabs/hardhat-vyper';
import '@matterlabs/hardhat-zksync-vyper';
import '@matterlabs/hardhat-zksync-deploy';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zkvyper: {
        version: '1.2.0',
        compilerSource: 'binary',
    },
    networks: {
        hardhat: {
            zksync: true,
        },
    },
    // Currently, only Vyper ^0.3.3 is supported.
    vyper: {
        version: '0.3.3',
    },
};

export default config;
