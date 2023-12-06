import { TASK_COMPILE } from "@matterlabs/hardhat-zksync-verify/dist/src/constants";
import { resetHardhatContext } from 'hardhat/plugins-testing';
import { HardhatRuntimeEnvironment } from "hardhat/types";

export const MOCK_ADDRESS = '0x110eb1e16A63c608787236E728Fa1817C72e6950';
export const WRONG_NUMBER_OF_CONSTRUCTOR_ARGUMENTS_ERROR =
    'The number of constructor arguments you provided (2) does not match the number of constructor arguments the contract has been deployed with (0).';
export const CONTRACT_ALREADY_VERIFIED_ERROR = 'This contract is already verified';


declare module 'mocha' {
    interface Context {
        env: HardhatRuntimeEnvironment;
    }
}

export function useEnvironment(networkName = 'testnet') {
    before('Loading hardhat environment', async function () {
        process.env.HARDHAT_NETWORK = networkName;
        this.env = require('hardhat');
        await this.env.run(TASK_COMPILE);
        this.deployedAddress = '0x000000';
    });

    after('Resetting hardhat', function () {
        resetHardhatContext();
    });
}