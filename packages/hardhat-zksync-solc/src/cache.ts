import fsExtra from "fs-extra";
import path from "path";
import * as t from "io-ts";

import type { ProjectPathsConfig } from "hardhat/types/config";

import { CACHE_FORMAT_VERSION, ZKSOLC_FILES_CACHE_FILENAME } from "./constants";
import type { ZkSolcConfig } from "./types";

const CacheEntryCodec = t.type({
  lastModificationDate: t.number,
  contentHash: t.string,
  sourceName: t.string,
  zkSolcConfig: t.any,
  artifacts: t.array(t.string),
});

const CacheCodec = t.type({
  _format: t.string,
  files: t.record(t.string, CacheEntryCodec),
});

export interface CacheEntry {
  lastModificationDate: number;
  contentHash: string;
  sourceName: string;
  zkSolcConfig: ZkSolcConfig;
  artifacts: string[];
}

export interface Cache {
  _format: string;
  files: Record<string, CacheEntry>;
}

export class ZkFilesCache {
  public static createEmpty(): ZkFilesCache {
    return new ZkFilesCache({
      _format: CACHE_FORMAT_VERSION,
      files: {},
    });
  }

  public static async readFromFile(
    zkFilesCachePath: string
  ): Promise<ZkFilesCache> {
    let cacheRaw: Cache = {
      _format: CACHE_FORMAT_VERSION,
      files: {},
    };
    if (fsExtra.existsSync(zkFilesCachePath)) {
      cacheRaw = await fsExtra.readJson(zkFilesCachePath);
    }

    const result = CacheCodec.decode(cacheRaw);

    if (result.isRight()) {
      const zkFilesCache = new ZkFilesCache(result.value);
      await zkFilesCache.removeNonExistingFiles();
      return zkFilesCache;
    }

    return new ZkFilesCache({
      _format: CACHE_FORMAT_VERSION,
      files: {},
    });
  }

  constructor(private _cache: Cache) {}

  public async removeNonExistingFiles() {
    for (const absolutePath of Object.keys(this._cache.files)) {
      if (!fsExtra.existsSync(absolutePath)) {
        this.removeEntry(absolutePath);
        continue;
      }
    }
  }

  public async writeToFile(solidityFilesCachePath: string) {
    await fsExtra.outputJson(solidityFilesCachePath, this._cache, {
      spaces: 2,
    });
  }

  public addFile(absolutePath: string, entry: CacheEntry) {
    this._cache.files[absolutePath] = entry;
  }

  public getEntries(): CacheEntry[] {
    return Object.values(this._cache.files);
  }

  public getEntry(file: string): CacheEntry | undefined {
    return this._cache.files[file];
  }

  public removeEntry(file: string) {
    delete this._cache.files[file];
  }

  public hasFileChanged(absolutePath: string, contentHash: string): boolean {
    const cacheEntry = this.getEntry(absolutePath);

    if (cacheEntry === undefined) {
      // new file or no cache available, assume it's new
      return true;
    }

    if (cacheEntry.contentHash !== contentHash) {
      return true;
    }

    return false;
  }
}

export function getZkFilesCachePath(paths: ProjectPathsConfig): string {
  return path.join(paths.cache, ZKSOLC_FILES_CACHE_FILENAME);
}
