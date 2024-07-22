import { HardhatRuntimeEnvironment } from 'hardhat/types';
import fs from 'fs';
import chalk from 'chalk';
import lodash from 'lodash';
import { ZkSyncEthersPluginError } from './errors';
import { LIBRARIES_NOT_EXIST_ON_NETWORK_ERROR, META_DATA_NUMBER_OF_BYTES } from './constants';
import { cleanLibraries, generateFullQuailfiedNameString } from './utils';
import { loadArtifact } from './helpers';
import { loadLibraries } from './libraries-saver';

export interface MissingDeployLibrariesChecker {
    check: (hre: HardhatRuntimeEnvironment, opts: any) => Promise<boolean>;
    postAction: (hre: HardhatRuntimeEnvironment, opts: any) => Promise<void>;
}

export class MissingLibrariesFileChecker implements MissingDeployLibrariesChecker {
    public async check(hre: HardhatRuntimeEnvironment): Promise<boolean> {
        return fs.existsSync(hre.config.zksolc.settings.missingLibrariesPath!);
    }

    public async postAction(_: HardhatRuntimeEnvironment): Promise<void> {}
}

export class MissingLibrariesOnNetworkChecker implements MissingDeployLibrariesChecker {
    public async check(hre: HardhatRuntimeEnvironment, __: any): Promise<boolean> {
        if (!hre.config.zksolc?.settings?.libraries) {
            return false;
        }

        const checks = [];

        for (const [librarySourceName, libraries] of Object.entries(hre.config.zksolc.settings.libraries!)) {
            for (const [libraryName, libraryAddress] of Object.entries(libraries)) {
                checks.push(
                    await this._checkIfLibraryExists(
                        hre,
                        generateFullQuailfiedNameString({
                            contractName: libraryName,
                            contractPath: librarySourceName,
                        }),
                        libraryAddress,
                    ),
                );
            }
        }

        const results = await Promise.all(checks);
        return results.some((result) => !result);
    }

    public async postAction(hre: HardhatRuntimeEnvironment, opts: any): Promise<void> {
        cleanLibraries(hre, opts);
        throw new ZkSyncEthersPluginError(chalk.yellow(LIBRARIES_NOT_EXIST_ON_NETWORK_ERROR));
    }

    private async _checkIfLibraryExists(
        hre: HardhatRuntimeEnvironment,
        libraryFQN: string,
        libraryAddress: string,
    ): Promise<boolean> {
        return await hre.zksyncEthers.providerL2.getCode(libraryAddress).then(async (bytecode) => {
            if (bytecode === '0x') {
                return false;
            }

            try {
                const libraryArtifact = await loadArtifact(hre, libraryFQN);

                if (!loadArtifact) {
                    return false;
                }

                return lodash.isEqual(this._sliceMetaData(libraryArtifact.bytecode), this._sliceMetaData(bytecode));
            } catch (error) {
                return false;
            }
        });
    }

    private _sliceMetaData(bytecode: string): string {
        return bytecode.slice(0, -META_DATA_NUMBER_OF_BYTES);
    }
}

export class MissingLibrariesCachedChecker implements MissingDeployLibrariesChecker {
    public async check(hre: HardhatRuntimeEnvironment): Promise<boolean> {
        if (
            (!hre.config.zksolc?.settings?.libraries ||
                Object.keys(hre.config.zksolc.settings.libraries).length === 0) &&
            (await loadLibraries(hre))
        ) {
            return true;
        }

        return false;
    }

    public async postAction(_: HardhatRuntimeEnvironment): Promise<void> {}
}

export enum DeployLibrariesValidators {
    MISSING_LIBRARIES_FILE_CHECKER = 'MissingLibraryFileChecker',
    MISSING_LIBRARIES_ON_NETWORK_CHECKER = 'MissingLibrariesOnNetworkChecker',
    MISSING_LIBRARIES_CACHED_CHECKER = 'MissingLibrariesCachedChecker',
}

export const ALL_MISSING_LIBRARIES_CHECKERS = new Map<DeployLibrariesValidators, MissingDeployLibrariesChecker>([
    [DeployLibrariesValidators.MISSING_LIBRARIES_FILE_CHECKER, new MissingLibrariesFileChecker()],
    [DeployLibrariesValidators.MISSING_LIBRARIES_ON_NETWORK_CHECKER, new MissingLibrariesOnNetworkChecker()],
    [DeployLibrariesValidators.MISSING_LIBRARIES_CACHED_CHECKER, new MissingLibrariesCachedChecker()],
]);

export interface MissingLibrariesValidatorActions {
    postActions: () => Promise<void>;
    areLibrariesMissing: () => boolean;
}

export class MissingLibrariesValidator implements MissingLibrariesValidatorActions {
    private notPassedValidators: Array<MissingDeployLibrariesChecker | undefined> = [];

    private constructor(
        private _hre: HardhatRuntimeEnvironment,
        private _missingLibrariesCheckers: Array<MissingDeployLibrariesChecker | undefined>,
        private _opts?: any,
    ) {}

    public static async create(
        hre: HardhatRuntimeEnvironment,
        missingLibrariesCheckers: Array<MissingDeployLibrariesChecker | undefined>,
        opts?: any,
    ): Promise<MissingLibrariesValidatorActions> {
        const missingLibrariesValidator = new MissingLibrariesValidator(hre, missingLibrariesCheckers, opts);
        await missingLibrariesValidator.check();
        return missingLibrariesValidator as MissingLibrariesValidatorActions;
    }

    public async check(): Promise<void> {
        if (!this._missingLibrariesCheckers) {
            return;
        }

        const checks: any[] = [];

        this._missingLibrariesCheckers.forEach((checker) => {
            checks.push(checker?.check(this._hre, this._opts));
        });

        const results = await Promise.all(checks);

        results.forEach((result, index) => {
            if (result) {
                this.notPassedValidators.push(this._missingLibrariesCheckers[index]);
            }
        });
    }

    public async postActions() {
        if (this.notPassedValidators.length === 0) {
            return;
        }

        const actions: any[] = [];

        this.notPassedValidators.forEach(async (checker) => {
            if (checker) {
                actions.push(checker.postAction(this._hre, this._opts));
            }
        });

        await Promise.all(actions);
    }

    public areLibrariesMissing() {
        return this.notPassedValidators.length > 0;
    }
}
