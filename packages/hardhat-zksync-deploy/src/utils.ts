import { HttpNetworkConfig, NetworkConfig } from 'hardhat/types';

export function isHttpNetworkConfig(networkConfig: NetworkConfig): networkConfig is HttpNetworkConfig {
    return 'url' in networkConfig;
}
