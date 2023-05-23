import { HardhatRuntimeEnvironment } from "hardhat/types";
import { linkProxyWithImplementationAbi, verifiableContracts, verifyWithArtifactOrFallback } from "./verify-proxy";
import { 
  getImplementationAddress, 
  isEmptySlot,
  getAdminAddress
} from '@openzeppelin/upgrades-core';

/**
 * Fully verifies all contracts related to the given transparent or UUPS proxy address: implementation, admin (if any), and proxy.
 * Also links the proxy to the implementation ABI on Etherscan.
 *
 * This function will determine whether the address is a transparent or UUPS proxy based on whether its creation bytecode matches with
 * TransparentUpgradeableProxy or ERC1967Proxy.
 *
 * Note: this function does not use the admin slot to determine whether the proxy is transparent or UUPS, but will always verify
 * the admin address as long as the admin storage slot has an address.
 *
 * @param hre
 * @param proxyAddress The transparent or UUPS proxy address
 * @param hardhatVerify A function that invokes the hardhat-etherscan plugin's verify command
 * @param errorReport Accumulated verification errors
 */
export async function fullVerifyTransparentOrUUPS(
    hre: HardhatRuntimeEnvironment,
    proxyAddress: any,
    hardhatVerify: (address: string) => Promise<any>,
  ) {
    const provider = hre.network.provider;
    const implAddress = await getImplementationAddress(provider, proxyAddress);
    await verifyImplementation(hardhatVerify, implAddress);
  
  
    await verifyTransparentOrUUPS();
    await linkProxyWithImplementationAbi(proxyAddress, implAddress);
    // Either UUPS or Transparent proxy could have admin slot set, although typically this should only be for Transparent
    await verifyAdmin();
  
    async function verifyAdmin() {
      const adminAddress = await getAdminAddress(provider, proxyAddress);
      if (!isEmptySlot(adminAddress)) {
        console.log(`Verifying proxy admin: ${adminAddress}`);
        try {
          await verifyWithArtifactOrFallback(
            hre,
            hardhatVerify,
            adminAddress,
            [verifiableContracts.proxyAdmin],
            // The user provided the proxy address to verify, whereas this function is only verifying the related proxy admin.
            // So even if this falls back and succeeds, we want to keep any errors that might have occurred while verifying the proxy itself.
            false,
          );
        } catch (e: any) {
         
            console.log(
              'Verification skipped for proxy admin - the admin address does not appear to contain a ProxyAdmin contract.',
            );
          
        }
      }
    }
  
    async function verifyTransparentOrUUPS() {
      console.log(`Verifying proxy: ${proxyAddress}`);
      await verifyWithArtifactOrFallback(
        hre,
        hardhatVerify,
        proxyAddress,
        [verifiableContracts.transparentUpgradeableProxy, verifiableContracts.erc1967proxy],
        true,
      );
    }
  }
  