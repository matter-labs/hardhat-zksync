import { spawn, ChildProcess, StdioOptions } from 'child_process';
import chalk from 'chalk';

export class JsonRpcServer {
    private serverProcess: ChildProcess | null = null;
    private keepAliveInterval: NodeJS.Timeout | null = null;

    constructor(private readonly serverBinaryPath: string) { }

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

            let stdioConfig: StdioOptions = 'inherit';
            if (!blockProcess) {
                // When not blocking, ignore all stdio
                stdioConfig = ['ignore', 'ignore', 'ignore'];
            }
            this.serverProcess = spawn(command, commandArgs, { stdio: stdioConfig });

            this.serverProcess.on('error', (error) => {
                console.error(chalk.red('Error starting server process:', error));
                this.clearKeepAlive();
                reject(error);
            });

            this.serverProcess.on('exit', (code) => {
                if (blockProcess) {
                    console.info(chalk.yellow('Server process has been stopped.'));
                }
                this.clearKeepAlive();
                if (code !== 0) {
                    reject(new Error(`Server process exited with code ${code}`));
                } else {
                    resolve();
                }
            });

            if (blockProcess) {
                this.keepAlive();
            } else {
                // Resolve immediately for non-blocking mode
                resolve();
            }
        });
    }

    public stop(): Promise<void> {
        return new Promise((resolve) => {
            if (this.serverProcess && !this.serverProcess.killed) {
                this.serverProcess.kill(); // Sends SIGTERM
                this.serverProcess.on('exit', () => {
                    this.clearKeepAlive();
                    resolve();
                });
            } else {
                this.clearKeepAlive();
                resolve();
            }
        });
    }

    private keepAlive() {
        if (!this.keepAliveInterval) {
            this.keepAliveInterval = setInterval(() => { }, 1e6);
        }
    }

    private clearKeepAlive() {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
    }
}
