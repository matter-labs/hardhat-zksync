#!/usr/bin/env node

import os from 'os';
import fs from 'fs';
import path from 'path';

// Returns true if the package exists, false otherwise
function packageExists(packagePath: string): boolean {
    try {
        require.resolve(packagePath);
        return true;
    } catch (err) {
        return false;
    }
}

// Returns the path to the package, or undefined if it doesn't exist
function findPackagePath(packageName: string, workingDir: string): string | undefined {
    let currentDir = workingDir;
    let packagePath = currentDir + '/node_modules/' + packageName;
    
    while (currentDir !== '/') {
        if (packageExists(packagePath)) {
            return packagePath;
        }
        currentDir = path.dirname(currentDir);
        packagePath = currentDir + '/node_modules/' + packageName;
    }

    return undefined;
}

// Returns a solc-js wrapper
async function getSolc(_pathToSolcJs: string, workingDir: string) {
    // 
    const packagePath = findPackagePath('solc/wrapper', workingDir);

    // @ts-ignore
    const { default: solcWrapper } = await import(packagePath);
    const _loadedSolc = solcWrapper(
        _loadCompilerSources(_pathToSolcJs)
    );

    return _loadedSolc;
}

export function _loadCompilerSources(compilerPath: string) {
    const Module = module.constructor as any;

    // if Hardhat is bundled (for example, in the vscode extension), then
    // Module._extenions might be undefined. In that case, we just use a plain
    // require.
    if (Module._extensions === undefined) {
        return require(compilerPath);
    }

    const previousHook = Module._extensions[".js"];

    Module._extensions[".js"] = function (
        module: NodeJS.Module,
        filename: string
    ) {
        const content = fs.readFileSync(filename, "utf8");
        Object.getPrototypeOf(module)._compile.call(module, content, filename);
    };

    const loadedSolc = require(compilerPath);

    Module._extensions[".js"] = previousHook;

    return loadedSolc;
}

// Read stdin into a string
async function readStdin(): Promise<string> {
    return new Promise(resolve => {
      let inputString = '';
      process.stdin.on('data', chunk => inputString += chunk);
      process.stdin.on('end', () => resolve(inputString));
    });
}

(async function () {
    // Strings that need to be replaced by the caller when generating the file
    const solcJsPath = 'SOLCJS_PATH';
    const workingDir = 'WORKING_DIR';
    
    // Wrapped solc-js compiler
    const solcJsCompiler = await getSolc(solcJsPath, workingDir);

    if (process.argv.includes("--version")) {
        const version = await solcJsCompiler.version();

        process.stdout.write("solc, the solidity compiler commandline interface" + os.EOL);
        process.stdout.write("Version: " + version + os.EOL);
    } else {
        const input = await readStdin();
        const jsonOutput = solcJsCompiler.compile(input);

        process.stdout.write(jsonOutput);
    }
})();
