import '@nomiclabs/hardhat-vyper';
import '../src/index';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zkvyper: {
        compilerSource: "binary",
    },
    networks: {
        hardhat: {
            zksync: true
        }
    },
    vyper: {
        version: "0.3.3"
    }
}

export default config;
