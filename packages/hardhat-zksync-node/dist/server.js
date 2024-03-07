"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonRpcServer = void 0;
const child_process_1 = require("child_process");
const chalk_1 = __importDefault(require("chalk"));
const constants_1 = require("./constants");
class JsonRpcServer {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    constructor(serverBinaryPath) {
        this.serverBinaryPath = serverBinaryPath;
        this.serverProcess = null;
    }
    listen(args = [], blockProcess = true) {
        return new Promise((resolve, reject) => {
            const command = this.serverBinaryPath;
            const commandArgs = args;
            const portArg = args.find((arg) => arg.startsWith('--port='));
            const port = portArg ? parseInt(portArg.split('=')[1], 10) : 8011;
            if (blockProcess) {
                console.info(chalk_1.default.green(`Starting the JSON-RPC server at 127.0.0.1:${port}`));
                console.info(chalk_1.default.green(`Running command: ${command} ${commandArgs.join(' ')}`));
            }
            let stdioConfig = 'inherit';
            if (!blockProcess) {
                stdioConfig = ['ignore', 'ignore', 'ignore'];
            }
            this.serverProcess = (0, child_process_1.spawn)(command, commandArgs, { stdio: stdioConfig });
            this.serverProcess.on('error', (error) => {
                console.info(chalk_1.default.red('Error running the server:', error));
                reject(new Error(`Error running the server: ${error.message}`));
            });
            this.serverProcess.on('exit', (code, signal) => {
                if (signal && constants_1.PROCESS_TERMINATION_SIGNALS.includes(signal)) {
                    console.info(chalk_1.default.yellow(`Received ${signal} signal. The server process has exited.`));
                    resolve();
                }
                else {
                    reject(new Error(`The server process exited with code: ${code}`));
                }
            });
            if (!blockProcess) {
                resolve();
            }
        });
    }
    stop() {
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
exports.JsonRpcServer = JsonRpcServer;
//# sourceMappingURL=server.js.map