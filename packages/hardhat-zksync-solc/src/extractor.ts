import { MultiSolcUserConfig, SolcUserConfig, SolidityUserConfig } from "hardhat/types";

export interface SolcUserConfigExtractor {
    extract(solidityConfig: SolidityUserConfig | undefined): SolcUserConfigData;
    suitable(solidityConfig: SolidityUserConfig | undefined): boolean;
}

export class SolcSoloUserConfigExtractor implements SolcUserConfigExtractor {
    suitable(solidityConfig: SolidityUserConfig | undefined): boolean {
        if (!solidityConfig) {
            return false;
        }

        return isSolcUserConfig(solidityConfig);
    }

    extract(solidityConfig: SolcUserConfig | undefined): SolcUserConfigData {
        if (!solidityConfig) {
            return {
                compilers: [],
            };
        }

        return {
            compilers: [solidityConfig]
        };
    }
}

export class SolcMultiUserConfigExtractor implements SolcUserConfigExtractor {
    suitable(solidityConfig: SolidityUserConfig | undefined): boolean {
        if (!solidityConfig) {
            return false;
        }

        return isMultiSolcUserConfig(solidityConfig);
    }

    extract(solidityConfig: MultiSolcUserConfig | undefined): SolcUserConfigData {
        if (!solidityConfig) {
            return {
                compilers: [],
            };
        }
        let overrides: Map<string, SolcUserConfig> = new Map();
        for (const [file, compiler] of Object.entries(solidityConfig.overrides ?? {})) {
            overrides.set(file, compiler);
        }
        return {
            compilers: solidityConfig.compilers,
            overides: overrides,
        };
    }
}

export class SolcStringUserConfigExtractor implements SolcUserConfigExtractor {
    suitable(solidityConfig: string | undefined): boolean {
        if (!solidityConfig) {
            return false;
        }

        return typeof solidityConfig === 'string';
    }

    extract(solidityConfig: MultiSolcUserConfig | undefined): SolcUserConfigData {
        return {
            compilers: []
        }
    }
}

export const extractors: SolcUserConfigExtractor[] = [
    new SolcStringUserConfigExtractor(),
    new SolcSoloUserConfigExtractor(),
    new SolcMultiUserConfigExtractor(),
];

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