import '../src/index';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        compilerSource: 'binary',
        settings: {
            viaYul: parseBoolean(process.env.VIA_YUL) || true,
            viaEVMAssembly: parseBoolean(process.env.VIA_EVM_ASSEMBLY) || false,
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

function parseBoolean(value: string | undefined): boolean {
    if (value === undefined) {
        return false;
    }
    return value === 'true';
}

export default config;
