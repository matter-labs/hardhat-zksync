import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Provider, Wallet, Contract } from 'zksync-ethers';
import * as hre from 'hardhat';

async function main() {
  const mnemonic =
    'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
  const provider = new Provider('http://127.0.0.1:8011');
  const zkWallet = Wallet.fromMnemonic(mnemonic).connect(provider);

  const deployer = new Deployer(hre, zkWallet);

  const Box = await deployer.loadArtifact('Box');
  const proxy = await hre.zkUpgrades.deployProxy(zkWallet, Box, [42], { initializer: 'store' });
  await proxy.waitForDeployment();

  const { abi: BoxAbi } = await hre.artifacts.readArtifact('Box');
  const box = new Contract(await proxy.getAddress(), BoxAbi, zkWallet);

  const value = await box.retrieve();
  console.info('Box value is: ', value);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
