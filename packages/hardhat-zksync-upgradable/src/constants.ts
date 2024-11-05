export const PLUGIN_NAME = '@matterlabs/hardhat-zksync-upgradable';

export const ITUP_JSON = 'ITransparentUpgradeableProxy.json';
export const TUP_JSON = 'TransparentUpgradeableProxy.json';
export const BEACON_PROXY_JSON = 'BeaconProxy.json';
export const UPGRADABLE_BEACON_JSON = 'UpgradeableBeacon.json';
export const PROXY_ADMIN_JSON = 'ProxyAdmin.json';
export const ERC1967_PROXY_JSON = 'ERC1967Proxy.json';
export const LOCAL_SETUP_ZKSYNC_NETWORK = 'http://0.0.0.0:8011';
export const FORMAT_TYPE_MINIMAL = 'minimal';
export const MANIFEST_DEFAULT_DIR = '.upgradable';

export const ZKSOLC_ARTIFACT_FORMAT_VERSION = 'hh-zksolc-artifact-1';
export const ZKVYPER_ARTIFACT_FORMAT_VERSION = 'hh-zkvyper-artifact-1';

export const UPGRADEABLE_CONTRACTS_FROM_ALIAS = {
    TransparentUpgradeableProxy:
        '@openzeppelin/contracts-hardhat-zksync-upgradable/proxy/transparent/TransparentUpgradeableProxy.sol',
    ITransparentUpgradeableProxy:
        '@openzeppelin/contracts-hardhat-zksync-upgradable/proxy/transparent/ITransparentUpgradeableProxy.sol',
    ProxyAdmin: '@openzeppelin/contracts-hardhat-zksync-upgradable/proxy/transparent/ProxyAdmin.sol',
    BeaconProxy: '@openzeppelin/contracts-hardhat-zksync-upgradable/proxy/beacon/BeaconProxy.sol',
    UpgradeableBeacon: '@openzeppelin/contracts-hardhat-zksync-upgradable/proxy/beacon/UpgradeableBeacon.sol',
    ERC1967Proxy: '@openzeppelin/contracts-hardhat-zksync-upgradable/proxy/ERC1967/ERC1967Proxy.sol',
};

export const UPGRADEABLE_CONTRACTS_FROM_CONTRACTS = {
    TransparentUpgradeableProxy: '@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol',
    ITransparentUpgradeableProxy: '@openzeppelin/contracts/proxy/transparent/ITransparentUpgradeableProxy.sol',
    ProxyAdmin: '@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol',
    BeaconProxy: '@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol',
    UpgradeableBeacon: '@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol',
    ERC1967Proxy: '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol',
};

export const UPGRADE_VERIFY_ERROR =
    'The verify plugin must be imported before the hardhat-upgrades plugin.' +
    'Import the plugins in the following order in hardhat.config.js:\n';

export const TOPIC_LOGS_NOT_FOUND_ERROR = (topic: string, address: string) =>
    `No logs found for event topic ${topic} at address ${address}\n` +
    `One of possible reasons can be that you are trying to verify a UUPS contract`;

export const EVENT_NOT_FOUND_ERROR = (address: string, events: string[]) =>
    `Could not find an event with any of the following topics in the logs for address ${address}: ${events.join(
        ', ',
    )}` +
    'If the proxy was recently deployed, the transaction may not be available on Block Explorer yet. Try running the verify task again after waiting a few blocks.';

export const IMPL_CONTRACT_NOT_DEPLOYED_ERROR =
    'The implementation contract was not previously deployed.\n' +
    'The useDeployedImplementation option was set to true but the implementation contract was not previously deployed on this network.';

export const verifiableContracts = {
    erc1967proxy: { event: 'Upgraded(address)' },
    beaconProxy: { event: 'BeaconUpgraded(address)' },
    upgradeableBeacon: { event: 'OwnershipTransferred(address,address)' },
    transparentUpgradeableProxy: { event: 'AdminChanged(address,address)' },
    proxyAdmin: { event: 'OwnershipTransferred(address,address)' },
};

export const OZ_CONTRACTS_VERISION_INCOMPATIBLE_ERROR = `The @matterlabs/hardhat-zksync-upgradable plugin utilizes the @openzeppelin/contracts dependency for proxy contracts, compatible with versions between 4.6.0 and 4.9.6. Please update the dependecy to a version within this range for optimal functionality.`;
