import { Account, getAddressOf } from "./account";
import * as zk from "zksync-web3";

export interface BalanceChangeOptions {
  includeFee?: boolean;
}

export function getAddresses(accounts: Array<Account | string>) {
  return Promise.all(accounts.map((account) => getAddressOf(account)));
}

export async function getBalances(
  accounts: Array<Account | string>,
  blockNumber?: number
) {
  const { BigNumber } = await import("ethers");
  const hre = await import("hardhat");

  const provider = new zk.Provider(hre.config.zkSyncDeploy.zkSyncNetwork);
  console.log(hre.config.zkSyncDeploy.zkSyncNetwork);
  console.log(accounts[0])
  const result = await provider.send("eth_getBalance", [
    accounts[0] as string,
    `0x${blockNumber?.toString(16) ?? 0}`,
  ]);
  console.log(result);
  const balance = await provider.getBalance(accounts[0] as string);
  console.log(balance);
  return Promise.all(
    accounts.map(async (account) => {
      const address = await getAddressOf(account);
      const result = await provider.send("eth_getBalance", [
        address,
        `0x${blockNumber?.toString(16) ?? 0}`,
      ]);
      return BigNumber.from(result);
    })
  );
}