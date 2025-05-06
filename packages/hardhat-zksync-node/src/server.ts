import { spawn, ChildProcess } from 'child_process';
import chalk from 'chalk';

import { PROCESS_TERMINATION_SIGNALS } from './constants';

export interface RpcServer {
    listen(args?: string[], blockProcess?: boolean): Promise<void>;
    stop(): Promise<void>;
}

export class JsonRpcServer implements RpcServer {
    private serverProcess: ChildProcess | null = null;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    constructor(private readonly serverBinaryPath: string) {}

    public listen(args: string[] = [], blockProcess: boolean = true): Promise<void> {
        return new Promise((resolve, reject) => {
            const command = this.serverBinaryPath;
            const commandArgs = args;

            const portArg = args.find((arg) => arg.startsWith('--port='));
            const port = portArg ? parseInt(portArg.split('=')[1], 10) : 8011;

            if (blockProcess) {
                console.info(chalk.green(`Starting the JSON-RPC server at 127.0.0.1:${port}`));
                console.info(chalk.green(`Running command: ${command} ${commandArgs.join(' ')}`));
            }

            this.serverProcess = spawn(command, commandArgs, { stdio: 'inherit' });

            this.serverProcess.on('error', (error) => {
                console.info(chalk.red('Error running the server:', error));
                reject(new Error(`Error running the server: ${error.message}`));
            });

            this.serverProcess.on('exit', (code, signal) => {
                if (signal && PROCESS_TERMINATION_SIGNALS.includes(signal)) {
                    console.info(chalk.yellow(`Received ${signal} signal. The server process has exited.`));
                    resolve();
                } else {
                    reject(new Error(`The server process exited with code: ${code}`));
                }
            });

            if (!blockProcess) {
                resolve();
            }
        });
    }

    public stop(): Promise<void> {
        return new Promise((resolve) => {
            if (this.serverProcess && !this.serverProcess.killed) {
                this.serverProcess.kill(); // Sends SIGTERM
                // this.serverProcess.on('exit', () => {
                //     resolve();
                // });
            }
            resolve();
        });
    }
}
