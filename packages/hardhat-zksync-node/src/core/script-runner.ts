import { isRunningHardhatCoreTests } from 'hardhat/internal/core/execution-mode';
import { HardhatArguments } from 'hardhat/types';
import { getEnvVariablesMap } from 'hardhat/internal/core/params/env-variables';
import { HardhatContext } from 'hardhat/internal/context';
import { request } from 'http';
import { configureNetwork, startServer, waitForNodeToBeReady } from '../utils';

export async function runScript(
    scriptPath: string,
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

    const envVars = { ...process.env, ...extraEnvVars };

    return new Promise((resolve, reject) => {
        const childProcess = fork(scriptPath, scriptArgs, {
            stdio: 'inherit',
            execArgv: nodeArgs,
            env: envVars,
        });

        let runnedServer: any;

        childProcess.on('spawn', () => {
            return new Promise(async (_, rejectChild) => {
                try {
                    request('hardhat/register');
                    const ctx = HardhatContext.getHardhatContext();
                    const { commandArgs, server, port } = await startServer();
                    runnedServer = server;
                    await server.listen(commandArgs, false);
                    await waitForNodeToBeReady(port);
                    await configureNetwork(ctx.environment!.config, ctx.environment!.network, port);
                } catch (error) {
                    rejectChild(error);
                }
            });
        });

        childProcess.once('close', (status) => {
            runnedServer?.stop();
            resolve(status as number);
        });

        childProcess.once('error', (error) => {
            runnedServer?.stop();
            reject(error);
        });
    });
}

export async function runScriptWithHardhat(
    hardhatArguments: HardhatArguments,
    scriptPath: string,
    scriptArgs: string[] = [],
    extraNodeArgs: string[] = [],
    extraEnvVars: { [name: string]: string } = {},
): Promise<number> {
    return runScript(scriptPath, scriptArgs, [...extraNodeArgs], {
        ...getEnvVariablesMap(hardhatArguments),
        ...extraEnvVars,
    });
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
