import { execSync } from 'child_process';
import chalk from 'chalk';

import { PROCESS_TERMINATION_SIGNALS } from './constants';

export class JsonRpcServer {
    private readonly _serverBinaryPath: string;

    constructor(serverBinaryPath: string) {
        this._serverBinaryPath = serverBinaryPath;
    }

    public listen(args: string[] = []): void {
        const command = `${this._serverBinaryPath} ${args.join(' ')}`;
        try {
            console.info(chalk.green(`Starting the JSON-RPC server with command: ${command}`));
            execSync(command, { stdio: 'inherit' });
        } catch (error: any) {
            if (PROCESS_TERMINATION_SIGNALS.includes(error.signal)) {
                console.info(chalk.yellow(`Received ${error.signal} signal. The server process has exited.`));
                return;
            }
            throw new Error(`The server process has exited with an error: ${error.message}`);
        }
    }
}
