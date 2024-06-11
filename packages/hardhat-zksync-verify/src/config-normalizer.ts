import { SolcConfig, SolcUserConfig } from 'hardhat/types';
import { isBreakableCompilerVersion } from '@matterlabs/hardhat-zksync-solc/dist/src/utils';
import { COMPILERS_CONFLICT_ZKVM_SOLC } from './constants';
import { ZkSyncVerifyPluginError } from './errors';
import { getZkVmNormalizedVersion } from './utils';

export interface SolcConfigData {
    compiler: SolcConfig;
    file?: string;
}

export interface SolcUserConfigNormalizer {
    suituble(_solcUserConfig: SolcUserConfig[] | Map<string, SolcUserConfig>, _file?: string): boolean;
    normalize(
        _compiler: SolcConfig,
        _zkSolcConfig: any,
        _latestEraVersion: string,
        _solcUserConfig: SolcUserConfig[] | Map<string, SolcUserConfig>,
        _file?: string,
    ): string;
}

export class OverrideCompilerSolcUserConfigNormalizer implements SolcUserConfigNormalizer {
    public suituble(_solcUserConfig: SolcUserConfig[] | Map<string, SolcUserConfig>, _file?: string): boolean {
        return _solcUserConfig instanceof Map && _file !== undefined;
    }

    public normalize(
        _compiler: SolcConfig,
        _zkSolcConfig: any,
        _latestEraVersion: string,
        _userConfigCompilers: Map<string, SolcUserConfig>,
        _file: string,
    ): string {
        const compilerInfo = _userConfigCompilers.get(_file);

        if (isBreakableCompilerVersion(_zkSolcConfig.version)) {
            return compilerInfo?.eraVersion
                ? getZkVmNormalizedVersion(_compiler.version, compilerInfo.eraVersion)
                : getZkVmNormalizedVersion(_compiler.version, _latestEraVersion);
        }

        return compilerInfo?.eraVersion
            ? getZkVmNormalizedVersion(_compiler.version, compilerInfo.eraVersion)
            : _compiler.version;
    }
}

export class CompilerSolcUserConfigNormalizer implements SolcUserConfigNormalizer {
    public suituble(solcUserConfig: SolcUserConfig[] | Map<string, SolcUserConfig>, _file?: string): boolean {
        return solcUserConfig instanceof Array && _file === undefined;
    }

    public normalize(
        _compiler: SolcConfig,
        _zkSolcConfig: any,
        _latestEraVersion: string,
        _userConfigCompilers: SolcUserConfig[],
        _file?: string,
    ): string {
        const compilerInfos = _userConfigCompilers.filter(
            (userCompilerInfo) => userCompilerInfo.version === _compiler.version,
        );

        if (compilerInfos.length > 1) {
            const compilerInfosWithEraVersion = compilerInfos.filter((userCompilerInfo) => userCompilerInfo.eraVersion);

            if (compilerInfosWithEraVersion.length > 0 && compilerInfosWithEraVersion.length !== compilerInfos.length) {
                throw new ZkSyncVerifyPluginError(COMPILERS_CONFLICT_ZKVM_SOLC(_compiler.version));
            }
        }

        const compilerInfo = compilerInfos[0];

        if (isBreakableCompilerVersion(_zkSolcConfig.version)) {
            return compilerInfo?.eraVersion
                ? getZkVmNormalizedVersion(_compiler.version, compilerInfo.eraVersion)
                : getZkVmNormalizedVersion(_compiler.version, _latestEraVersion);
        }

        return compilerInfo?.eraVersion
            ? getZkVmNormalizedVersion(_compiler.version, compilerInfo.eraVersion)
            : _compiler.version;
    }
}
