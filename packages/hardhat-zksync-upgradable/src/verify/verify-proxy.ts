import {
  toCheckStatusRequest,
  toVerifyRequest,
} from '@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanVerifyContractRequest';
import {
  getVerificationStatus,
  verifyContract,
} from '@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanService';

import {
  getTransactionByHash,
  getImplementationAddress,
  getBeaconAddress,
  getImplementationAddressFromBeacon,
  UpgradesError,
  getAdminAddress,
  isTransparentOrUUPSProxy,
  isBeacon,
  isBeaconProxy,
  isEmptySlot,
} from '@openzeppelin/upgrades-core';
import artifactsBuildInfo from '@openzeppelin/upgrades-core/artifacts/build-info.json';

import { HardhatRuntimeEnvironment, RunSuperFunction } from 'hardhat/types';

import chalk from 'chalk';
import { fullVerifyBeacon, fullVerifyBeaconProxy } from './verify-beacon';
import { fullVerifyTransparentOrUUPS } from './verify-transparent-uups';
import { UPGRADE_VERIFY_ERROR } from '../constants';
import { getContractCreationTxHash, inferConstructorArgs } from '../utils/utils-general';
import { error } from 'console';

/**
 * Hardhat artifact for a precompiled contract
 */
interface ContractArtifact {
  contractName: string;
  sourceName: string;
  abi: any;
  bytecode: any;
}

/**
 * A contract artifact and the corresponding event that it logs during construction.
 */
interface VerifiableContractInfo {
  artifact: ContractArtifact;
  event: string;
}

interface ErrorReport {
  errors: string[];
  severity: 'error' | 'warn';
}

/**
 * The proxy-related contracts and their corresponding events that may have been deployed the current version of this plugin.
 */

// FIXME: Uncomment this
// const verifiableContracts = {
  // erc1967proxy: { artifact: ERC1967Proxy, event: 'Upgraded(address)' },
  // beaconProxy: { artifact: BeaconProxy, event: 'BeaconUpgraded(address)' },
  // upgradeableBeacon: { artifact: UpgradeableBeacon, event: 'OwnershipTransferred(address,address)' },
  // transparentUpgradeableProxy: { artifact: TransparentUpgradeableProxy, event: 'AdminChanged(address,address)' },
  // proxyAdmin: { artifact: ProxyAdmin, event: 'OwnershipTransferred(address,address)' },
// };

export const verifiableContracts = {
  erc1967proxy: { artifact: {} as ContractArtifact, event: 'Upgraded(address)' },
  beaconProxy: { artifact: {} as ContractArtifact, event: 'BeaconUpgraded(address)' },
  upgradeableBeacon: { artifact: {} as ContractArtifact, event: 'OwnershipTransferred(address,address)' },
  transparentUpgradeableProxy: { artifact: {} as ContractArtifact, event: 'AdminChanged(address,address)' },
  proxyAdmin: { artifact: {} as ContractArtifact, event: 'OwnershipTransferred(address,address)' },
};


/**
 * Overrides hardhat-etherscan's verify:verify subtask to fully verify a proxy or beacon.
 *
 * Verifies the contract at an address. If the address is an ERC-1967 compatible proxy, verifies the proxy and associated proxy contracts,
 * as well as the implementation. Otherwise, calls hardhat-etherscan's verify function directly.
 *
 * @param args Args to the hardhat-etherscan verify function
 * @param hre
 * @param runSuper The parent function which is expected to be hardhat-etherscan's verify function
 * @returns
 */
export async function verify(args: any, hre: HardhatRuntimeEnvironment, runSuper: RunSuperFunction<any>) {
  if (!runSuper.isDefined) {
    throw new UpgradesError(UPGRADE_VERIFY_ERROR);
  }

  const provider = hre.network.provider;
  const proxyAddress = args.address;

  if (await isTransparentOrUUPSProxy(provider, proxyAddress)) {
    await fullVerifyTransparentOrUUPS(hre, proxyAddress, hardhatVerify);
  } else if (await isBeaconProxy(provider, proxyAddress)) {
    await fullVerifyBeaconProxy(hre, proxyAddress, hardhatVerify);
  } else if (await isBeacon(provider, proxyAddress)) {
    await fullVerifyBeacon(hre, proxyAddress, hardhatVerify);
  } else {
    // Doesn't look like a proxy, so just verify directly
    return await runSuper({ ...args, proxyAddress })
  }


  async function hardhatVerify(address: string) {
    return ;
  }
}

/**
 * Indicates that the contract's bytecode does not match with the plugin's artifact.
 */
class BytecodeNotMatchArtifact extends Error {
  contractName: string;
  constructor(message: string, contractName: string) {
    super(message);
    this.contractName = contractName;
  }
}



/**
 * Looks for any of the possible events (in array order) at the specified address using Etherscan API,
 * and returns the corresponding VerifiableContractInfo and txHash for the first event found.
 *
 * @param etherscanApi The Etherscan API config
 * @param address The contract address for which to look for events
 * @param possibleContractInfo An array of possible contract artifacts to use for verification along
 *  with the corresponding creation event expected in the logs.
 * @returns the VerifiableContractInfo and txHash for the first event found
 * @throws {EventNotFound} if none of the events were found in the contract's logs according to Etherscan.
 */
async function searchEvent(
  address: string,
  possibleContractInfo: VerifiableContractInfo[],
) {
  for (let i = 0; i < possibleContractInfo.length; i++) {
    const contractInfo = possibleContractInfo[i];
    const txHash = await getContractCreationTxHash(address, contractInfo.event);
    if (txHash !== undefined) {
      return { contractInfo, txHash };
    }
  }

  const events = possibleContractInfo.map(contractInfo => {
    return contractInfo.event;
  });
  throw new Error(
    `Could not find an event with any of the following topics in the logs for address ${address}: ${events.join(', ')}`+
    'If the proxy was recently deployed, the transaction may not be available on Etherscan yet. Try running the verify task again after waiting a few blocks.',
  );
}

/**
 * Verifies a contract by matching with known artifacts.
 *
 * If a match was not found, falls back to verify directly using the regular hardhat verify task.
 *
 * If the fallback passes, logs as success.
 * If the fallback also fails, records errors for both the original and fallback attempts.
 *
 * @param hre
 * @param etherscanApi The Etherscan API config
 * @param address The contract address to verify
 * @param possibleContractInfo An array of possible contract artifacts to use for verification along
 *  with the corresponding creation event expected in the logs.
 * @param errorReport Accumulated verification errors
 * @param convertErrorsToWarningsOnFallbackSuccess If fallback verification occurred and succeeded, whether any
 *  previously accumulated errors should be converted into warnings in the final summary.
 * @throws {EventNotFound} if none of the events were found in the contract's logs according to Etherscan.
 */
export async function verifyWithArtifactOrFallback(
  hre: HardhatRuntimeEnvironment,
  hardhatVerify: (address: string) => Promise<any>,
  address: string,
  possibleContractInfo: VerifiableContractInfo[],
  convertErrorsToWarningsOnFallbackSuccess: boolean,
) {
  try {
    await attemptVerifyWithCreationEvent(hre, address, possibleContractInfo);
    return true;
  } catch (origError: any) {
    if (origError instanceof BytecodeNotMatchArtifact) {
      // Try falling back to regular hardhat verify in case the source code is available in the user's project.
      try {
        await hardhatVerify(address);
      } catch (fallbackError: any) {
        if (fallbackError.message.toLowerCase().includes('already verified')) {
          console.log(`Contract at ${address} already verified.`);
        } else {
          // Fallback failed, so record both the original error and the fallback attempt, then return
          if (origError instanceof BytecodeNotMatchArtifact) {
            //FIXME: change this
            console.log(origError.message);
          } else {
            //FIXME: change this
            console.log("asd");
          }

          //FIXME: change this
          console.log(fallbackError.message);
          return;
        }
      }
    }
  }
}

/**
 * Attempts to verify a contract by looking up an event that should have been logged during contract construction,
 * finds the txHash for that, and infers the constructor args to use for verification.
 *
 * Iterates through each element of possibleContractInfo to look for that element's event, until an event is found.
 *
 * @param hre
 * @param etherscanApi The Etherscan API config
 * @param address The contract address to verify
 * @param possibleContractInfo An array of possible contract artifacts to use for verification along
 *  with the corresponding creation event expected in the logs.
 * @param errorReport Accumulated verification errors
 * @throws {EventNotFound} if none of the events were found in the contract's logs according to Etherscan.
 * @throws {BytecodeNotMatchArtifact} if the contract's bytecode does not match with the plugin's known artifact.
 */
async function attemptVerifyWithCreationEvent(
  hre: HardhatRuntimeEnvironment,
  address: string,
  possibleContractInfo: VerifiableContractInfo[]
  ) {
  const { contractInfo, txHash } = await searchEvent(address, possibleContractInfo);
  console.info(chalk.yellow(`verifying contract ${contractInfo.artifact.contractName} at ${address}`));

  const tx = await getTransactionByHash(hre.network.provider, txHash);
  if (tx === null) {
    // This should not happen since the txHash came from the logged event itself
    throw new UpgradesError(`The transaction hash ${txHash} from the contract's logs was not found on the network`);
  }

  const constructorArguments = inferConstructorArgs(tx.input, contractInfo.artifact.bytecode);
  if (constructorArguments === undefined) {
    // The creation bytecode for the address does not match with the expected artifact.
    // This may be because a different version of the contract was deployed compared to what is in the plugins.
    throw new BytecodeNotMatchArtifact(
      `Bytecode does not match with the current version of ${contractInfo.artifact.contractName} in the Hardhat Upgrades plugin.`,
      contractInfo.artifact.contractName,
    );
  } else {
    await verifyContractWithConstructorArgs(
      address,
      contractInfo.artifact,
      constructorArguments,
    );
  }
}

/**
 * Verifies a contract using the given constructor args.
 *
 * @param etherscanApi The Etherscan API config
 * @param address The address of the contract to verify
 * @param artifact The contract artifact to use for verification.
 * @param constructorArguments The constructor arguments to use for verification.
 */
async function verifyContractWithConstructorArgs(
  address: any,
  artifact: ContractArtifact,
  constructorArguments: string,
) {
  console.info(chalk.yellow(`verifying contract ${address} with constructor args ${constructorArguments}`));

  const params = {
    contractAddress: address,
    sourceCode: JSON.stringify(artifactsBuildInfo.input),
    sourceName: artifact.sourceName,
    contractName: artifact.contractName,
    compilerVersion: `v${artifactsBuildInfo.solcLongVersion}`,
    constructorArguments: constructorArguments,
  };

  // const request = toVerifyRequest(params);
  try {
    // FIXME: change this
    // const response = await verifyContract(request);
    const response = {}

    const statusRequest = {}
    // const status = await getVerificationStatus(statusRequest);
    // FIXME: change this
    const status = {isVerificationSuccess: () => true}

    if (status.isVerificationSuccess()) {
      console.log(`Successfully verified contract ${artifact.contractName} at ${address}.`);
    } else {
       //FIXME: change this
        console.log(`Failed to verify contract ${artifact.contractName} at ${address}.`);
    }
  } catch (e: any) {
    if (e.message.toLowerCase().includes('already verified')) {
      console.log(`Contract at ${address} already verified.`);
    } else {
       //FIXME: change this
       console.log(e);
    }
  }
}



/**
 * Calls the Etherscan API to link a proxy with its implementation ABI.
 *
 * @param etherscanApi The Etherscan API config
 * @param proxyAddress The proxy address
 * @param implAddress The implementation address
 */
export async function linkProxyWithImplementationAbi(
  proxyAddress: string,
  implAddress: string,
) {
  console.log(`Linking proxy ${proxyAddress} with implementation`);
  const params = {
    module: 'contract',
    action: 'verifyproxycontract',
    address: proxyAddress,
    expectedimplementation: implAddress,
  };
  // let responseBody = await callEtherscanApi(etherscanApi, params);
  let responseBody = {status: {}, result: {}};

  //FIXME: Change responseBody.status to RESPONSE_OK
  if (responseBody.status === 200) {
    // initial call was OK, but need to send a status request using the returned guid to get the actual verification status
    const guid = responseBody.result;

    // FIXME: change this
    // responseBody = await checkProxyVerificationStatus(etherscanApi, guid);

    // while (responseBody.result === 'Pending in queue') {
    //   await delay(3000);
    //   responseBody = await checkProxyVerificationStatus(etherscanApi, guid);
    // }
  }

  // Change response 
  if (responseBody.status === 200) {
    console.log('Successfully linked proxy to implementation.');
  } else {
     //FIXME: change this
     console.log();
  }

  async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
