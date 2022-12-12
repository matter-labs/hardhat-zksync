import { AssertionError, expect } from 'chai';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';
import { resetHardhatContext } from 'hardhat/plugins-testing';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import path from 'path';

declare module 'mocha' {
    interface Context {
        hre: HardhatRuntimeEnvironment;
    }
}

export function useEnvironmentWithLocalSetup(fixtureProjectName: string, networkName = 'zkSyncNetwork') {
    const fixtureProjectDir = path.resolve(__dirname, 'fixture-projects', fixtureProjectName);

    before('Run ZkSync Chai Matchers', async function () {
        process.chdir(fixtureProjectDir);
        process.env.HARDHAT_NETWORK = networkName;

        this.hre = require('hardhat');
        await this.hre.run(TASK_COMPILE);
    });

    after(async function () {
        resetHardhatContext();
    });
}

/**
 * Call `method` as:
 *   - A write transaction
 *   - A view method
 *   - A gas estimation
 *   - A static call
 * And run the `successfulAssert` function with the result of each of these
 * calls. Since we expect this assertion to be successful, we just await its
 * result; if any of them fails, an error will be thrown.
 */
export async function runSuccessfulAsserts({
    matchers,
    method,
    args = [],
    successfulAssert,
}: {
    matchers: any;
    method: string;
    args?: any[];
    successfulAssert: (x: any) => Promise<void>;
}) {
    await successfulAssert(matchers[method](...args));
    await successfulAssert(matchers[`${method}View`](...args));
    // await successfulAssert(matchers.estimateGas[method](...args));
    await successfulAssert(matchers.callStatic[method](...args));
}

/**
 * Similar to runSuccessfulAsserts, but check that the result of the assertion
 * is an AssertionError with the given reason.
 */
export async function runFailedAsserts({
    matchers,
    method,
    args = [],
    failedAssert,
    failedAssertReason,
}: {
    matchers: any;
    method: string;
    args?: any[];
    failedAssert: (x: any) => Promise<void>;
    failedAssertReason: string;
}) {
    await expect(failedAssert(matchers[method](...args))).to.be.rejectedWith(AssertionError, failedAssertReason);
    await expect(failedAssert(matchers[`${method}View`](...args))).to.be.rejectedWith(
        AssertionError,
        failedAssertReason
    );
    // await expect(
    //   failedAssert(matchers.estimateGas[method](...args))
    // ).to.be.rejectedWith(AssertionError, failedAssertReason);
    await expect(failedAssert(matchers.callStatic[method](...args))).to.be.rejectedWith(
        AssertionError,
        failedAssertReason
    );
}
