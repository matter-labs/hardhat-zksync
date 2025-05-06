import { isRunningHardhatCoreTests } from 'hardhat/internal/core/execution-mode';
import { HardhatArguments } from 'hardhat/types';
import { getEnvVariablesMap } from 'hardhat/internal/core/params/env-variables';
import path from 'path';
import { startServer, waitForNodeToBeReady } from '../utils';
import { ZkSyncAnvilConfig } from '../types';

export async function runScript(
    scriptPath: string,
    zksyncAnvilConfig: ZkSyncAnvilConfig,
    scriptArgs: string[] = [],
    extraNodeArgs: string[] = [],
    extraEnvVars: { [name: string]: string } = {},
): Promise<number> {
    const { fork } = await import('child_process');
    const processExecArgv = withFixedInspectArg(process.execArgv);

    const nodeArgs = [
        ...processExecArgv,
        ...getTsNodeArgsIfNeeded(scriptPath, extraEnvVars.HARDHAT_TYPECHECK === 'true'),
        ...extraNodeArgs,
    ];

    const { commandArgs, server, port } = await startServer(
        zksyncAnvilConfig.version,
        zksyncAnvilConfig.binaryPath,
        false,
        { quiet: true },
    );
    await server.listen(commandArgs, false);
    await waitForNodeToBeReady(port);

    const envVars = { ...process.env, ...extraEnvVars, ZKNodePort: port.toString() };

    return new Promise((resolve, reject) => {
        const childProcess = fork(scriptPath, scriptArgs, {
            stdio: 'inherit',
            execArgv: nodeArgs,
            env: envVars,
        });

        childProcess.once('close', async (status) => {
            await server.stop();
            resolve(status as number);
        });

        childProcess.once('error', async (error) => {
            await server.stop();
            reject(error);
        });
    });
}

export async function runScriptWithHardhat(
    hardhatArguments: HardhatArguments,
    zksyncAnvilConfig: ZkSyncAnvilConfig,
    scriptPath: string,
    scriptArgs: string[] = [],
    extraNodeArgs: string[] = [],
    extraEnvVars: { [name: string]: string } = {},
): Promise<number> {
    return runScript(
        scriptPath,
        zksyncAnvilConfig,
        scriptArgs,
        [...extraNodeArgs, '--require', path.join(__dirname, 'register')],
        {
            ...getEnvVariablesMap(hardhatArguments),
            ...extraEnvVars,
        },
    );
}

function withFixedInspectArg(argv: string[]) {
    const fixIfInspectArg = (arg: string) => {
        if (arg.toLowerCase().includes('--inspect-brk=')) {
            return '--inspect';
        }
        return arg;
    };
    return argv.map(fixIfInspectArg);
}

function getTsNodeArgsIfNeeded(scriptPath: string, shouldTypecheck: boolean): string[] {
    if (process.execArgv.includes('ts-node/register')) {
        return [];
    }

    // if we are running the tests we only want to transpile, or these tests
    // take forever
    if (isRunningHardhatCoreTests()) {
        return ['--require', 'ts-node/register/transpile-only'];
    }

    // If the script we are going to run is .ts we need ts-node
    if (/\.tsx?$/i.test(scriptPath)) {
        return ['--require', `ts-node/register${shouldTypecheck ? '' : '/transpile-only'}`];
    }

    return [];
}
