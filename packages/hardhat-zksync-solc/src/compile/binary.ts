import { exec } from 'child_process';
import { ZkSolcConfig } from '../types';

export async function compileWithBinary(input: any, config: ZkSolcConfig, solcPath: string, detectMissingLibrariesMode: boolean = false): Promise<any> {
  const { compilerPath, isSystem, forceEvmla } = config.settings;

  const processCommand = `${compilerPath} --standard-json ${isSystem ? '--system-mode' : ''} ${forceEvmla ? '--force-evmla' : ''} --solc ${solcPath} `;

  const output: string = await new Promise((resolve, reject) => {
    const process = exec(
      processCommand,
      {
        maxBuffer: 1024 * 1024 * 500,
      },
      (err, stdout, _stderr) => {
        if (err !== null) {
          return reject(err);
        }
        resolve(stdout);
      }
    );

    process.stdin!.write(JSON.stringify(input));
    process.stdin!.end();
  });

  var input2 = JSON.parse(JSON.stringify(input));
  input2["settings"] = {
    "optimizer": {
      "enabled": true
    },
    "outputSelection": {
      "*": {
        "": [],
        "*": ["abi", "metadata", "devdoc", "userdoc", "storageLayout", "evm.legacyAssembly", "evm.methodIdentifiers"]
      }
    }
  };

  const output2: string = await new Promise((resolve, reject) => {
    const processCommand = `${solcPath} --standard-json`;
    const process = exec(
      processCommand,
      {
        maxBuffer: 1024 * 1024 * 500,
      },
      (err, stdout, _stderr) => {
        if (err !== null) {
          return reject(err);
        }
        resolve(stdout);
      }
    );

    process.stdin!.write(JSON.stringify(input2));
    process.stdin!.end();
  });
  
  var result = JSON.parse(output);
  var o2 = JSON.parse(output2);
  let { contracts } = o2;
  for (const filename in contracts) {
    var oneFile = contracts[filename];
    for (const contractname in oneFile) {
      var oneContract = oneFile[contractname];
      
      const { evm } = oneContract;
      const { legacyAssembly } = evm;
      result['contracts'][filename][contractname]['evm']['legacyAssembly'] = legacyAssembly;
    }
  }
  return result;
}
