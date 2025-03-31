import { extendEnvironment } from 'hardhat/config';
import './type-extensions';
import { ExtensionGenerator } from './generator';
import '@matterlabs/hardhat-zksync-telemetry';

extendEnvironment((hre) => {
    const extensionGenerator = new ExtensionGenerator(hre);
    hre.ethers = extensionGenerator.populatedExtension();

    if (hre.network.zksync) {
        hre.zksyncEthers = extensionGenerator.populatedExtension();
    }
});

export { HardhatZksyncEthersProvider } from './hardhat-zksync-provider';
export { HardhatZksyncSigner } from './signers/hardhat-zksync-signer';
