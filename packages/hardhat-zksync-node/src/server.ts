import { execSync } from 'child_process';

import chalk from 'chalk';

import { PROCESS_TERMINATION_SIGNALS } from './constants';

export class JsonRpcServer {
    private readonly binaryPath: string;

    constructor(binaryPath: string) {
        this.binaryPath = binaryPath;
    }

    public listen(args: string[] = []): void {
        const command = `${this.binaryPath} ${args.join(' ')}`;
        try {
            execSync(command, { stdio: 'inherit' });
        } catch (error: any) {
            if (PROCESS_TERMINATION_SIGNALS.includes(error.signal)) {
                console.info(chalk.yellow(`Received ${error.signal}. Exiting.`));
                return;
            }
            throw error;
        }
    }
}
