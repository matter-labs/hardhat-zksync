import { expect } from "chai";
import sinon from "sinon";
import {
  delay,
  encodeArguments,
  executeVeificationWithRetry,
  handleAxiosError,
  parseWrongConstructorArgumentsError,
  removeMultipleSubstringOccurrences,
} from "../../src/utils";
import * as service from "../../src/zksync-block-explorer/service";
import axion from "axios";

describe("executeVeificationWithRetry", () => {
  let checkVerificationStatusServiceStub: sinon.SinonStub;

  beforeEach(() => {
    sinon.restore();
  });

  it("should return the verification status response when verification is successful", async () => {
    const requestId = 123;
    const verifyURL = "https://example.com/verify";
    const response = {
      isVerificationSuccess: sinon.stub().returns(true),
      isVerificationFailure: sinon.stub().returns(false),
    };

    checkVerificationStatusServiceStub = sinon
      .stub(service, "checkVerificationStatusService")
      .resolves(response as any);

    const result = await executeVeificationWithRetry(requestId, verifyURL);

    expect(result).to.equal(response);
    expect(
      checkVerificationStatusServiceStub.calledOnceWith(requestId, verifyURL),
    ).to.be.true;
  });

  it("should return the verification status response when verification is failed", async () => {
    const requestId = 123;
    const verifyURL = "https://example.com/verify";
    const response = {
      isVerificationSuccess: sinon.stub().returns(false),
      isVerificationFailure: sinon.stub().returns(true),
    };

    checkVerificationStatusServiceStub = sinon
      .stub(service, "checkVerificationStatusService")
      .resolves(response as any);

    const result = await executeVeificationWithRetry(requestId, verifyURL);

    expect(result).to.equal(response);
    expect(
      checkVerificationStatusServiceStub.calledOnceWith(requestId, verifyURL),
    ).to.be.true;
  });

  it("should return undefined when max retries exceeded", async () => {
    const requestId = 123;
    const verifyURL = "https://example.com/verify";
    const maxRetries = 2;
    const delayInMs = 100;

    const response = {
      isVerificationSuccess: sinon.stub().returns(false),
      isVerificationFailure: sinon.stub().returns(false),
    };

    checkVerificationStatusServiceStub = sinon
      .stub(service, "checkVerificationStatusService")
      .resolves(response as any);

    const result = await executeVeificationWithRetry(
      requestId,
      verifyURL,
      maxRetries,
      delayInMs,
    );

    expect(result).to.be.undefined;
    expect(checkVerificationStatusServiceStub.callCount).to.equal(
      maxRetries + 1,
    );
    expect(checkVerificationStatusServiceStub.calledWith(requestId, verifyURL))
      .to.be.true;
  });
});

describe("handleAxiosError", () => {
  beforeEach(() => {
    sinon.restore();
  });

  it("should throw an error with the Axios error details", () => {
    const error = {
      code: "SOME_CODE",
      response: {
        data: "Some error message",
      },
    };

    let axionStub = sinon.stub(axion, "isAxiosError").returns(true);

    expect(() => handleAxiosError(error)).to.throw(
      `Axios error (code: SOME_CODE) during the contract verification request\n Reason: ${error.response?.data}`,
    );
  });

  it("should throw a ZkSyncVerifyPluginError with the error message", () => {
    const error = "Some error message";

    expect(() => handleAxiosError(error)).to.throw(
      `Failed to send contract verification request\n Reason: ${error}`,
    );
  });
});

describe("delay", () => {
  it("should delay for the specified amount of time", async () => {
    const ms = 1000;
    const startTime = Date.now();
    await delay(ms);
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    expect(elapsedTime).to.be.at.least(ms);
  });
});

describe("encodeArguments", () => {
  it("should encode constructor arguments correctly", async () => {
    const abi = [
      {
        type: "constructor",
        inputs: [
          { type: "string", name: "name" },
          { type: "uint256", name: "age" },
        ],
      },
    ];
    const constructorArgs = ["John Doe", 25];
    const encodedData =
      "0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000001900000000000000000000000000000000000000000000000000000000000000084a6f686e20446f65000000000000000000000000000000000000000000000000";

    const result = await encodeArguments(abi, constructorArgs);

    expect(result).to.equal(encodedData);
  });

  it("should throw an error when constructor arguments are incorrect", async () => {
    const abi = [
      {
        type: "constructor",
        inputs: [
          { type: "string", name: "name" },
          { type: "uint256", name: "age" },
        ],
      },
    ];
    const constructorArgs = ["John Doe", "25", "43"];

    try {
      await encodeArguments(abi, constructorArgs);
      // Fail the test if no error is thrown
      expect.fail("Expected an error to be thrown");
    } catch (error: any) {
      expect(error.message).to.equal(
        "The number of constructor arguments you provided (3) does not match the number of constructor arguments the contract has been deployed with (2).",
      );
    }
  });
});

/*describe("retrieveContractBytecode", () => {
  let providerSendStub: sinon.SinonStub;

  beforeEach(() => {
    sinon.restore();
  });

  it("should return the deployed bytecode when the address has bytecode", async () => {
    const address = "0x1234567890abcdef";
    const hreNetwork = {
      config: {
        url: "https://example.com",
      },
      name: "test-network",
    };
    const bytecodeString = "0xabcdef1234567890";
    const providerResponse = `0x${bytecodeString}`;

    providerSendStub = sinon.stub().resolves(providerResponse);
    sinon.stub(zk, "Provider").resolves({
      send: providerSendStub,
    });

    const result = await retrieveContractBytecode(address, hreNetwork);

    expect(result).to.equal(bytecodeString);
    expect(providerSendStub.calledOnceWith("eth_getCode", [address, "latest"])).to.be.true;
  });

  it("should throw an error when the address has no bytecode", async () => {
    const address = "0x1234567890abcdef";
    const hreNetwork = {
      config: {
        url: "https://example.com",
      },
      name: "test-network",
    };
    const bytecodeString = "";

    providerSendStub = sinon.stub().resolves(bytecodeString);
    sinon.stub(zk, "Provider").resolves({
      send: providerSendStub,
    });

    try {
      await retrieveContractBytecode(address, hreNetwork);
      // Fail the test if no error is thrown
      expect.fail("Expected an error to be thrown");
    } catch (error: any) {
      expect(error.message).to.equal(
        `The address ${address} has no bytecode. Is the contract deployed to this network?\n  The selected network is ${hreNetwork.name}.`
      );
    }
  });
});*/

describe("removeMultipleSubstringOccurrences", () => {
  it("should remove all occurrences of the specified substring", () => {
    const inputString = "Hello, World!\n Hello, World! \nHello, World!";
    const stringToRemove = "Hello, World!";
    const expectedOutput = "Hello, World!";

    const result = removeMultipleSubstringOccurrences(
      inputString,
      stringToRemove,
    );

    expect(result).to.equal(expectedOutput);
  });

  it("should handle empty input string", () => {
    const inputString = "";
    const stringToRemove = "Hello, ";
    const expectedOutput = "";

    const result = removeMultipleSubstringOccurrences(
      inputString,
      stringToRemove,
    );

    expect(result).to.equal(expectedOutput);
  });

  it("should handle empty string to remove", () => {
    const inputString = "Hello, World!";
    const stringToRemove = "";
    const expectedOutput = "Hello, World!";

    const result = removeMultipleSubstringOccurrences(
      inputString,
      stringToRemove,
    );

    expect(result).to.equal(expectedOutput);
  });

  it("should handle no occurrences of the substring", () => {
    const inputString = "Hello, World!";
    const stringToRemove = "Foo, ";
    const expectedOutput = "Hello, World!";

    const result = removeMultipleSubstringOccurrences(
      inputString,
      stringToRemove,
    );

    expect(result).to.equal(expectedOutput);
  });
});

describe("parseWrongConstructorArgumentsError", () => {
  it("should return the correct error message", () => {
    const inputString = "Error: count=2, value=5, types=[string, uint256]";
    const expectedOutput =
      "The number of constructor arguments you provided (undefined) does not match the number of constructor arguments the contract has been deployed with (undefined).";

    const result = parseWrongConstructorArgumentsError(inputString);

    expect(result).to.equal(expectedOutput);
  });
});
