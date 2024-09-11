import { HardhatUserConfig } from 'hardhat/config';
import defaultHardhatConfig from '../../common.config';

const config: HardhatUserConfig = {
    ...defaultHardhatConfig,
    zksolc: {
        ...defaultHardhatConfig.zksolc,
        settings: {
            ...(defaultHardhatConfig.zksolc?.settings || {}),
            suppressedErrors: ['sendtransfer'] as const,
            suppressedWarnings: ['txorigin'] as const,
        },
    },
};

export default config;
