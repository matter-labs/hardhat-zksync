import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Provider, Wallet } from 'zksync-ethers';
import * as hre from 'hardhat';

async function main() {
  const mnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
  const provider = new Provider('http://127.0.0.1:8011');
  const zkWallet = Wallet.fromMnemonic(mnemonic).connect(provider);

  const deployer = new Deployer(hre, zkWallet);
  console.log('Deployer address:', zkWallet.address);

  // ── deploy v1 ─────────────────────────────────────────────────────────────
  const Box = await deployer.loadArtifact('Box');
  const box = await hre.zkUpgrades.deployProxy(zkWallet, Box, [42], { initializer: 'store' });
  await box.waitForDeployment();
  console.log('Box value (v1):', await box.retrieve());

  // ── upgrade to v2 ─────────────────────────────────────────────────────────
  const BoxV2 = await deployer.loadArtifact('BoxV2');
  const upgraded = await hre.zkUpgrades.upgradeProxy(zkWallet, await box.getAddress(), BoxV2);
  await upgraded.waitForDeployment(); 
  console.info('Successfully upgraded Box to BoxV2');
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
