import { promises as fs } from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';
import type { HardhatRuntimeEnvironment } from 'hardhat/types';

import {
    ValidationDataCurrent,
    ValidationRunData,
    concatRunData,
    isCurrentValidationData,
} from '@openzeppelin/upgrades-core';

async function lock(file: string) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    return lockfile.lock(file, { retries: { minTimeout: 50, factor: 1.3 }, realpath: false });
}

export async function writeValidations(hre: HardhatRuntimeEnvironment, newRunData: ValidationRunData): Promise<void> {
    const cachePath = getValidationsCachePath(hre);
    let releaseLock;
    try {
        releaseLock = await lock(cachePath);
        const storedData = await readValidations(hre, false).catch((e) => {
            if (e instanceof ValidationsCacheNotFound) {
                return undefined;
            } else {
                throw e;
            }
        });
        const validations = concatRunData(newRunData, storedData);
        await fs.writeFile(cachePath, JSON.stringify(validations, null, 2));
    } finally {
        await releaseLock?.();
    }
}

export async function readValidations(
    hre: HardhatRuntimeEnvironment,
    acquireLock = true,
): Promise<ValidationDataCurrent> {
    const cachePath = getValidationsCachePath(hre);
    let releaseLock;
    try {
        if (acquireLock) {
            releaseLock = await lock(cachePath);
        }
        const data = JSON.parse(await fs.readFile(cachePath, 'utf8'));
        if (!isCurrentValidationData(data)) {
            await fs.unlink(cachePath);
            throw new ValidationsCacheOutdated();
        }
        return data;
    } catch (e: any) {
        if (e.code === 'ENOENT') {
            throw new ValidationsCacheNotFound();
        } else {
            throw e;
        }
    } finally {
        await releaseLock?.();
    }
}

export class ValidationsCacheNotFound extends Error {
    constructor() {
        super('Validations cache not found.');
    }
}

export class ValidationsCacheOutdated extends Error {
    constructor() {
        super('Validations cache is outdated.`');
    }
}

function getValidationsCachePath(hre: HardhatRuntimeEnvironment): string {
    return path.join(hre.config.paths.cache, 'validations.json');
}
