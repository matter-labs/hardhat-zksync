import type { BigNumber } from "ethers";

import { AssertionError } from "chai";

import { HardhatChaiMatchersDecodingError } from "@nomicfoundation/hardhat-chai-matchers/internal/errors";
import { panicErrorCodeToReason } from "@nomicfoundation/hardhat-chai-matchers/internal/reverted/panic";

// method id of 'Error(string)'
const ERROR_STRING_PREFIX = "0x08c379a0";

// method id of 'Panic(uint256)'
const PANIC_CODE_PREFIX = "0x4e487b71";

/**
 * Try to obtain the return data of a transaction from the given value.
 *
 * If the value is an error but it doesn't have data, we assume it's not related
 * to a reverted transaction and we re-throw it.
 */
export function getReturnDataFromError(error: any): string {
  if (!(error instanceof Error)) {
    throw new AssertionError("Expected an Error object");
  }

  // cast to any again so we don't have to cast it every time we access
  // some property that doesn't exist on Error
  error = error as any;

  // const errorData = error.data ?? error.error?.data;

  const returnData = error.error?.error?.data?.message;


  // if (errorData === undefined) {
  //   throw error;
  // }

  // const returnData = typeof errorData === "string" ? errorData : errorData.data;

  if (returnData === undefined || typeof returnData !== "string") {
    throw error;
  }

  return returnData;
}

type DecodedReturnData =
  | {
      kind: "Error";
      reason: string;
    }
  | {
      kind: "Empty";
    }
  | {
      kind: "Panic";
      code: BigNumber;
      description: string;
    }
  | {
      kind: "Custom";
      id: string;
      data: string;
    };

type FuncSelectorData = {
  funcSelector: string;
  data: string;
}

export function decodeReturnData(returnData: string): DecodedReturnData {
  const { defaultAbiCoder: abi } = require("@ethersproject/abi");
  if (returnData === "0x") {
    return { kind: "Empty" };
  } else if (returnData.startsWith(ERROR_STRING_PREFIX)) {
    const encodedReason = returnData.slice(ERROR_STRING_PREFIX.length);
    let reason: string;
    try {
      reason = abi.decode(["string"], `0x${encodedReason}`)[0];
    } catch (e: any) {
      throw new HardhatChaiMatchersDecodingError(encodedReason, "string", e);
    }

    return {
      kind: "Error",
      reason,
    };
  } else if (returnData.startsWith(PANIC_CODE_PREFIX)) {
    const encodedReason = returnData.slice(PANIC_CODE_PREFIX.length);
    let code: BigNumber;
    try {
      code = abi.decode(["uint256"], `0x${encodedReason}`)[0];
    } catch (e: any) {
      throw new HardhatChaiMatchersDecodingError(encodedReason, "uint256", e);
    }

    const description = panicErrorCodeToReason(code) ?? "unknown panic code";

    return {
      kind: "Panic",
      code,
      description,
    };
  }

  return {
    kind: "Custom",
    id: returnData.slice(0, 10),
    data: `0x${returnData.slice(10)}`,
  };
}

export function getFuncSelectorData(message: string): FuncSelectorData {
  if (!message.includes("Error function_selector")) {
    const { defaultAbiCoder: abi } = require("@ethersproject/abi");

    let reason = message.replace("Cannot estimate transaction: ", "");
    reason = reason.replace(".", "");

    const encoded = abi.encode(["string"], [reason])

    return {
      funcSelector: ERROR_STRING_PREFIX,
      data: encoded,
    }
  }

  let [x, funcSelectorWithData] = message.split(
    "Cannot estimate transaction: Error function_selector = "
  );
  let [funcSelector, data] = funcSelectorWithData.split(", data = ");
  data = data.replace(".", "");

  return {
    funcSelector,
    data
  }
}

export function encodeFuncSelectorWithData(message: string): string {
  let { funcSelector, data } = getFuncSelectorData(message);

  if (data.startsWith("0x")) {
    data = data.slice("0x".length);
  }

  return funcSelector + data
}

export function decodeReturnDataTODO(returnData: string): DecodedReturnData {
  const { defaultAbiCoder: abi } = require("@ethersproject/abi");
  if (!returnData.includes("Error function_selector")) {
    let reason = returnData.replace("Cannot estimate transaction: ", "");
    reason = reason.replace(".", "");

    return {
      kind: "Error",
      reason,
    };
  } else {
    // let [x, funcSelectorWithData] = returnData.split(
    //   "Cannot estimate transaction: Error function_selector = "
    // );
    // let [funcSelector, data] = funcSelectorWithData.split(", data = ");
    // data = data.replace(".", "");

    const { funcSelector, data } = getFuncSelectorData(returnData);

    if(funcSelector === "0x") { 
      return { kind: "Empty" }
    } else if(funcSelector === "0x4e487b71") {
      let code: BigNumber;
      try {
        code = abi.decode(["uint256"], data)[0];
      } catch (e: any) {
        throw new HardhatChaiMatchersDecodingError(data, "uint256", e);
      }
  
      const description = panicErrorCodeToReason(code) ?? "unknown panic code";
  
      return {
        kind: "Panic",
        code,
        description,
      };
    } else {
      return {
        kind: "Custom",
        id: funcSelector,
        data: data,
      };
    }
  }
}
