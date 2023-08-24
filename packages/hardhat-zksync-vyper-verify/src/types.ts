
import { CacheEntry } from '@nomiclabs/hardhat-vyper/dist/src/cache';
import { ResolvedFile } from '@nomiclabs/hardhat-vyper/dist/src/types';

export type CacheResolveFileInfo = {
    resolvedFile: ResolvedFile;
    contractCache: CacheEntry;
}