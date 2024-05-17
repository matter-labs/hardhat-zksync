import { SolcConfig, SolcUserConfig } from 'hardhat/types';
import chalk from 'chalk';
import {
    COMPILERS_CONFLICT_ZKVM_SOLC,
    ZKVM_SOLC_COMPILER_NEEDS_ERA_VERSION,
    ZKVM_SOLC_DEFAULT_COMPILER_VERSION,
} from './constants';
import { ZkSyncSolcPluginError } from './errors';
import { ZkSolcConfig } from './types';
import { needsMandatoryCodegen } from './utils';

export interface SolcConfigData {
    compiler: SolcConfig;
    file?: string;
}

export interface SolcUserConfigUpdater {
    suituble(_solcUserConfig: SolcUserConfig[] | Map<string, SolcUserConfig>, _file?: string): boolean;
    update(
        _compiler: SolcConfig,
        _zksolc: ZkSolcConfig,
        _solcUserConfig: SolcUserConfig[] | Map<string, SolcUserConfig>,
        _file?: string,
    ): void;
}

export class OverrideCompilerSolcUserConfigUpdater implements SolcUserConfigUpdater {
    public suituble(_solcUserConfig: SolcUserConfig[] | Map<string, SolcUserConfig>, _file?: string): boolean {
        return _solcUserConfig instanceof Map && _file !== undefined;
    }

    public update(
        _compiler: SolcConfig,
        _zksolc: ZkSolcConfig,
        _userConfigCompilers: Map<string, SolcUserConfig>,
        _file: string,
    ): void {
        const compilerInfo = _userConfigCompilers.get(_file);

        if (compilerInfo?.eraVersion) {
            _compiler.eraVersion = compilerInfo.eraVersion;
        } else if (
            _compiler.settings.viaEVMAssembly &&
            !_compiler.eraVersion &&
            needsMandatoryCodegen(_zksolc.version)
        ) {
            console.warn(chalk.blue(ZKVM_SOLC_COMPILER_NEEDS_ERA_VERSION(_compiler.version)));
            _compiler.eraVersion = ZKVM_SOLC_DEFAULT_COMPILER_VERSION;
        }
    }
}

export class CompilerSolcUserConfigUpdater implements SolcUserConfigUpdater {
    public suituble(solcUserConfig: SolcUserConfig[] | Map<string, SolcUserConfig>, _file?: string): boolean {
        return solcUserConfig instanceof Array && _file === undefined;
    }

    public update(
        _compiler: SolcConfig,
        _zksolc: ZkSolcConfig,
        _userConfigCompilers: SolcUserConfig[],
        _file?: string,
    ): void {
        const compilerInfos = _userConfigCompilers.filter(
            (userCompilerInfo) => userCompilerInfo.version === _compiler.version,
        );

        if (compilerInfos.length > 1) {
            const compilerInfosWithEraVersion = compilerInfos.filter((userCompilerInfo) => userCompilerInfo.eraVersion);

            if (compilerInfosWithEraVersion.length > 0 && compilerInfosWithEraVersion.length !== compilerInfos.length) {
                throw new ZkSyncSolcPluginError(COMPILERS_CONFLICT_ZKVM_SOLC(_compiler.version));
            }
        }

        const compilerInfo = compilerInfos[0];

        if (compilerInfo?.eraVersion) {
            _compiler.eraVersion = compilerInfo.eraVersion;
        } else if (
            _compiler.settings.viaEVMAssembly &&
            !_compiler.eraVersion &&
            needsMandatoryCodegen(_zksolc.version)
        ) {
            console.warn(chalk.blue(ZKVM_SOLC_COMPILER_NEEDS_ERA_VERSION(_compiler.version)));
            _compiler.eraVersion = ZKVM_SOLC_DEFAULT_COMPILER_VERSION;
        }
    }
}
