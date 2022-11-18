import type { Contract, Signer, Wallet } from "zksync-web3";

import assert from "assert";

export type Account = Signer | Wallet | Contract;

export function isAccount(account: Account): account is Contract | Wallet {
  const zksyncWeb3 = require("zksync-web3");
  return account instanceof zksyncWeb3.Contract || account instanceof zksyncWeb3.Wallet;
}

export async function getAddressOf(account: Account | string) {
  if (typeof account === "string") {
    assert(/^0x[0-9a-fA-F]{40}$/.test(account), `Invalid address ${account}`);
    return account;
  } else if (isAccount(account)) {
    return account.address;
  } else {
    return account.getAddress();
  }
}