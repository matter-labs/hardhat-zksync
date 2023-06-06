export const PLUGIN_NAME = '@matterlabs/hardhat-zksync-upgradable';

export const ITUP_JSON = 'ITransparentUpgradeableProxy.json';
export const TUP_JSON = 'TransparentUpgradeableProxy.json';
export const BEACON_PROXY_JSON = 'BeaconProxy.json';
export const UPGRADABLE_BEACON_JSON = 'UpgradeableBeacon.json';
export const PROXY_ADMIN_JSON = 'ProxyAdmin.json';
export const ERC1967_PROXY_JSON = 'ERC1967Proxy.json';
export const LOCAL_SETUP_ZKSYNC_NETWORK = 'http://localhost:3050';
export const FORMAT_TYPE_MINIMAL = 'minimal';
export const MANIFEST_DEFAULT_DIR = '.upgradable';

export const PROXY_SOURCE_NAMES = [
    '@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol',
    '@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol',
    '@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol',
    '@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol',
    '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol',
];

export const UPGRADE_VERIFY_ERROR =
    'The verify plugin must be imported before the hardhat-upgrades plugin.' +
    'Import the plugins in the following order in hardhat.config.js:\n';

export const TOPIC_LOGS_NOT_FOUND_ERROR = (topic: string, address: string) => `No logs found for event topic ${topic} at address ${address}\n` +
`One of possible reasons can be that you are trying to verify a UUPS contract`

export const verifiableContracts = {
    erc1967proxy: { event: 'Upgraded(address)' },
    beaconProxy: { event: 'BeaconUpgraded(address)' },
    upgradeableBeacon: { event: 'OwnershipTransferred(address,address)' },
    transparentUpgradeableProxy: { event: 'AdminChanged(address,address)' },
    proxyAdmin: { event: 'OwnershipTransferred(address,address)' },
};
