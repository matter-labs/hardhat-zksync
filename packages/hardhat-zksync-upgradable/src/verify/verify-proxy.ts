import { getTransactionByHash, isTransparentOrUUPSProxy, isBeacon, isBeaconProxy } from '@openzeppelin/upgrades-core';

import { HardhatRuntimeEnvironment, RunSuperFunction } from 'hardhat/types';

import chalk from 'chalk';
import * as zk from 'zksync-ethers';
import { ethers } from 'ethers';
import { EVENT_NOT_FOUND_ERROR, UPGRADE_VERIFY_ERROR } from '../constants';
import { getContractCreationTxHash } from '../utils/utils-general';
import { VerifiableContractInfo } from '../interfaces';
import { ZkSyncUpgradablePluginError } from '../errors';
import { compileProxyContracts } from '../utils';
import { fullVerifyTransparentOrUUPS } from './verify-transparent-uups';
import { fullVerifyBeacon, fullVerifyBeaconProxy } from './verify-beacon';

/**
 * Overrides verify's plugin `verify:verify` subtask to fully verify a proxy or beacon.
 *
 * Verifies the contract at an address. If the address is an ERC-1967 compatible proxy, verifies the proxy and associated proxy contracts,
 * as well as the implementation. Otherwise, calls verify function directly.
 *
 */
export async function verify(args: any, hre: HardhatRuntimeEnvironment, runSuper: RunSuperFunction<any>) {
    if (!runSuper.isDefined) {
        throw new ZkSyncUpgradablePluginError(UPGRADE_VERIFY_ERROR);
    }

    const networkConfig: any = hre.network.config;
    const provider = new zk.Provider(networkConfig.url);
    const proxyAddress = args.address;

    if (await isTransparentOrUUPSProxy(provider, proxyAddress)) {
        await compileProxyContracts(hre, args.noCompile);
        await fullVerifyTransparentOrUUPS(hre, proxyAddress, hardhatZkSyncVerify, runSuper, args.noCompile);
    } else if (await isBeaconProxy(provider, proxyAddress)) {
        await compileProxyContracts(hre, args.noCompile);
        await fullVerifyBeaconProxy(hre, proxyAddress, hardhatZkSyncVerify, runSuper, args.noCompile);
    } else if (await isBeacon(provider, proxyAddress)) {
        await compileProxyContracts(hre, args.noCompile);
        await fullVerifyBeacon(hre, proxyAddress, hardhatZkSyncVerify, runSuper, args.noCompile);
    } else {
        return hardhatZkSyncVerify(proxyAddress);
    }

    async function hardhatZkSyncVerify(address: string) {
        return await runSuper({ ...args, address });
    }
}

/**
 * Looks for any of the possible events (in array order) at the specified address,
 * and returns the corresponding txHash for the first event found.
 *
 * @param address The contract address for which to look for events
 * @param possibleContractInfo An array of possible corresponding creation event expected in the logs.
 * @returns the xHash for the first event found
 */
async function searchEvent(provider: zk.Provider, address: string, possibleContractInfo: VerifiableContractInfo[]) {
    for (const contractInfo of possibleContractInfo) {
        const txHash = await getContractCreationTxHash(provider, address, contractInfo.event);
        if (txHash !== undefined) {
            return { contractInfo, txHash };
        }
    }

    const events = possibleContractInfo.map((contractInfo) => {
        return contractInfo.event;
    });
    throw new ZkSyncUpgradablePluginError(EVENT_NOT_FOUND_ERROR(address, events));
}

export async function verifyWithArtifact(
    hre: HardhatRuntimeEnvironment,
    address: string,
    possibleContractInfo: VerifiableContractInfo[],
    runSuper: RunSuperFunction<any>,
    noCompile: boolean,
) {
    try {
        await attemptVerifyWithCreationEvent(hre, address, possibleContractInfo, runSuper, noCompile);
        return true;
    } catch (fallbackError: any) {
        if (fallbackError.message.toLowerCase().includes('already verified')) {
            console.error(chalk.red(`Contract at ${address} already verified.`));
        } else {
            console.error(chalk.red(fallbackError.message));
            return;
        }
    }
}

/**
 * Attempts to verify a contract by looking up an event that should have been logged during contract construction,
 * finds the txHash for that, and infers the constructor args to use for verification.
 *
 * Iterates through each element of possibleContractInfo to look for that element's event, until an event is found.
 *
 * @param hre The hardhat runtime environment
 * @param address The contract address to verify
 * @param possibleContractInfo An array of possible contract artifacts to use for verification along
 *  with the corresponding creation event expected in the logs.
 * @param runSuper The runSuper function from the plugin
 */
async function attemptVerifyWithCreationEvent(
    hre: HardhatRuntimeEnvironment,
    address: string,
    possibleContractInfo: VerifiableContractInfo[],
    runSuper: RunSuperFunction<any>,
    noCompile: boolean,
) {
    const networkConfig: any = hre.network.config;
    const provider = new zk.Provider(networkConfig.url);

    const { txHash } = await searchEvent(provider, address, possibleContractInfo);

    const tx = await getTransactionByHash(provider, txHash);
    if (tx === null) {
        throw new ZkSyncUpgradablePluginError(
            `The transaction hash ${txHash} from the contract's logs was not found on the network`,
        );
    }
    const decodedInputData = ethers.AbiCoder.defaultAbiCoder().decode(
        ['bytes32', 'bytes32', 'bytes'],
        ethers.dataSlice(tx.input, 4),
    );
    const constructorArgs = decodedInputData[2];

    await runSuper({ address, constructorArguments: constructorArgs, libraries: {}, noCompile });
}
