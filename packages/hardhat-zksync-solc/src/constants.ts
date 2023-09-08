import { ZkSolcConfig } from './types';

export const PLUGIN_NAME = '@matterlabs/hardhat-zksync-solc';
export const ZK_ARTIFACT_FORMAT_VERSION = 'hh-zksolc-artifact-1';
export const ZKSOLC_BIN_REPOSITORY = 'https://github.com/matter-labs/zksolc-bin';
export const ZKSOLC_BIN_VERSION_INFO = `https://raw.githubusercontent.com/matter-labs/zksolc-bin/main`;
export const DETECT_MISSING_LIBRARY_MODE_COMPILER_VERSION = '1.3.14';

export const defaultZkSolcConfig: ZkSolcConfig = {
    version: 'latest',
    compilerSource: 'binary',
    settings: {
        optimizer: {
            enabled: true,
            mode: '3',
        },
        compilerPath: '',
        missingLibrariesPath: './.zksolc-libraries-cache/missingLibraryDependencies.json',
        areLibrariesMissing: false,
        experimental: {},
    },
};

export const ZKSOLC_COMPILERS_SELECTOR_MAP = {
    '1.3.5': [
        'abi',
        'evm.methodIdentifiers',
        'storageLayout',
        'irOptimized',
        'evm.legacyAssembly',
        'ast',
    ]
};

export const DEFAULT_COMPILER_VERSION_INFO_CACHE_PERIOD = 24 * 60 * 60 * 1000; // 24 hours

export const COMPILER_VERSION_INFO_FILE_NOT_FOUND_ERROR = 'Could not find zksolc compiler version info file. Please check your internet connection and try again.';
export const COMPILER_VERSION_INFO_FILE_DOWNLOAD_ERROR = 'Could not download zksolc compiler version info file. Please check your internet connection and try again.';

export const COMPILER_VERSION_RANGE_ERROR = (version: string, minVersion: string, latestVersion: string) => `Deprecated zksolc compiler version in hardhat config file (${version}). Please use versions ${minVersion} to ${latestVersion}.`;
export const COMPILER_VERSION_WARNING = (version: string, latestVersion: string) => `The zksolc compiler version in your Hardhat config file (${version}) is not the latest. We recommend using the latest version ${latestVersion}.`;
export const COMPILER_BINARY_CORRUPTION_ERROR = (compilerPath: string) => `The zksolc binary at path ${compilerPath} is corrupted. Please delete it and try again.`;
export const COMPILING_INFO_MESSAGE = (zksolcVersion: string, solcVersion: string) => `Compiling contracts for zkSync Era with zksolc v${zksolcVersion} and solc v${solcVersion}`;

export const MISSING_LIBRARIES_NOTICE = 'zksolc compiler detected missing libraries! For more details, visit: https://era.zksync.io/docs/tools/hardhat/compiling-libraries.html.';
export const COMPILE_AND_DEPLOY_LIBRARIES_INSTRUCTIONS = 'To compile and deploy libraries, please run: `yarn hardhat deploy-zksync:libraries --private-key <PRIVATE_KEY>`';
export const MISSING_LIBRARY_LINK = 'For more details on how to use deploy-zksync:libraries task from hardhat-zksync-deploy plugin, visit: https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-deploy.html.';

export const SOLCJS_EXECUTABLE_CODE = `#!/usr/bin/env node
"use strict";var __createBinding=this&&this.__createBinding||(Object.create?function(e,t,r,o){void 0===o&&(o=r);var i=Object.getOwnPropertyDescriptor(t,r);i&&("get"in i?t.__esModule:!i.writable&&!i.configurable)||(i={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,o,i)}:function(e,t,r,o){void 0===o&&(o=r),e[o]=t[r]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),__importStar=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&__createBinding(t,e,r);return __setModuleDefault(t,e),t},__importDefault=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0}),exports._loadCompilerSources=void 0;const os_1=__importDefault(require("os")),fs_1=__importDefault(require("fs")),path_1=__importDefault(require("path"));function packageExists(e){try{return require.resolve(e),!0}catch(e){return!1}}function findPackagePath(e,t){let r=t,o=r+"/node_modules/"+e;for(;"/"!==r;){if(packageExists(o))return o;r=path_1.default.dirname(r),o=r+"/node_modules/"+e}}async function getSolc(e,t){var r=findPackagePath("solc/wrapper",t);const{default:o}=await Promise.resolve().then(()=>__importStar(require(r)));return o(_loadCompilerSources(e))}function _loadCompilerSources(e){const t=module.constructor;if(void 0===t._extensions)return require(e);var r=t._extensions[".js"];t._extensions[".js"]=function(e,t){var r=fs_1.default.readFileSync(t,"utf8");Object.getPrototypeOf(e)._compile.call(e,r,t)};e=require(e);return t._extensions[".js"]=r,e}exports._loadCompilerSources=_loadCompilerSources;async function readStdin(){return new Promise(e=>{let t="";process.stdin.on("data",e=>t+=e),process.stdin.on("end",()=>e(t))})}!async function(){var e;const t=await getSolc("SOLCJS_PATH","WORKING_DIR");process.argv.includes("--version")?(e=await t.version(),process.stdout.write("solc, the solidity compiler commandline interface"+os_1.default.EOL),process.stdout.write("Version: "+e+os_1.default.EOL)):(e=await readStdin(),e=t.compile(e),process.stdout.write(e))}();`;