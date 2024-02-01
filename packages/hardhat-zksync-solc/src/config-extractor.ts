import { MultiSolcUserConfig, SolcUserConfig, SolidityUserConfig } from 'hardhat/types';

export interface SolcUserConfigExtractor {
    extract(_solidityConfig: SolidityUserConfig | undefined): SolcUserConfigData;
    suitable(_solidityConfig: SolidityUserConfig | undefined): boolean;
}

export class SolcSoloUserConfigExtractor implements SolcUserConfigExtractor {
    public suitable(_solidityConfig: SolidityUserConfig | undefined): boolean {
        if (!_solidityConfig) {
            return false;
        }

        return isSolcUserConfig(_solidityConfig);
    }

    public extract(_solidityConfig: SolcUserConfig | undefined): SolcUserConfigData {
        return {
            compilers: [_solidityConfig!],
        };
    }
}

export class SolcMultiUserConfigExtractor implements SolcUserConfigExtractor {
    public suitable(_solidityConfig: SolidityUserConfig | undefined): boolean {
        if (!_solidityConfig) {
            return false;
        }

        return isMultiSolcUserConfig(_solidityConfig);
    }

    public extract(_solidityConfig: MultiSolcUserConfig | undefined): SolcUserConfigData {
        const overrides: Map<string, SolcUserConfig> = new Map();
        for (const [file, compiler] of Object.entries(_solidityConfig!.overrides ?? {})) {
            overrides.set(file, compiler);
        }

        return {
            compilers: _solidityConfig!.compilers,
            overides: overrides,
        };
    }
}

export class SolcStringUserConfigExtractor implements SolcUserConfigExtractor {
    public suitable(_solidityConfig: string | undefined): boolean {
        if (!_solidityConfig) {
            return false;
        }

        return typeof _solidityConfig === 'string';
    }

    public extract(_solidityConfig: string | undefined): SolcUserConfigData {
        return {
            compilers: [],
        };
    }
}

export interface SolcUserConfigEntry {
    config: SolcUserConfig;
    fileName?: string;
}

export interface SolcUserConfigData {
    compilers: SolcUserConfig[];
    overides?: Map<string, SolcUserConfig>;
}

export function isSolcUserConfig(object: any): object is SolcUserConfig {
    return 'version' in object;
}

export function isMultiSolcUserConfig(object: any): object is MultiSolcUserConfig {
    return 'compilers' in object;
}
