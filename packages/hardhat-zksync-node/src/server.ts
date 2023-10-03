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

        const portArg = args.find(arg => arg.startsWith('--port='));
        const port = portArg ? parseInt(portArg.split('=')[1], 10) : 8011;

        try {
            console.info(chalk.green(`Starting the JSON-RPC server at 127.0.0.1:${port}`));
            console.info(chalk.green(`Running command: ${command}`));
            
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
