import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/config';
import { SuppressedMessageType } from '../../../src/types';

const config: HardhatUserConfig = {
    zksolc: {
        compilerSource: 'binary',
        settings: {
            suppressedErrors: [SuppressedMessageType.SendTransfer],
            suppressedWarnings: [SuppressedMessageType.TxOrigin],
        },
    },
    networks: {
        hardhat: {
            zksync: true,
        },
    },
    solidity: {
        version: process.env.SOLC_VERSION || '0.8.17',
    },
};

export default config;
