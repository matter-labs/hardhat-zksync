import { HttpNetworkConfig, Network, NetworkConfig } from 'hardhat/types';
import { ZkSyncDeployPluginError } from './zksync-deploy-plugin-error';

export function isHttpNetworkConfig(networkConfig: NetworkConfig): networkConfig is HttpNetworkConfig {
    return 'url' in networkConfig;
}

export function networkFromConfig(network: Network) {
    const networkName = network.name;

    if (networkName === 'hardhat') {
        return;
    }

    const networkConfig = network.config;

    if (!isHttpNetworkConfig(networkConfig)) {
        throw new ZkSyncDeployPluginError(
            `Invalid zkSync network configuration for '${networkName}' in 'hardhat.config' file. 'url' needs to be provided.`
        );
    }

    if (!networkConfig.zksync) {
        throw new ZkSyncDeployPluginError(
            `Invalid zkSync network configuration for '${networkName}' in 'hardhat.config' file. 'zksync' flag not set to 'true'.`
        );
    }

    if (networkConfig.ethNetwork === undefined) {
        throw new ZkSyncDeployPluginError(
            `Invalid zkSync network configuration for '${networkName}' in 'hardhat.config' file. 'ethNetwork' (layer 1) is missing.`
        );
    }

    network.zksync = true;
    network.ethNetwork = networkConfig.ethNetwork;
}
