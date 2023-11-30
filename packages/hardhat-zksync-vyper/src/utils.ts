import semver from 'semver';
import fs from "fs";
import path from "path";
import util from "util";
import fse from "fs-extra";
import type { Dispatcher } from "undici";

import { MultiVyperConfig } from '@nomiclabs/hardhat-vyper/dist/src/types';

import { CompilerVersionInfo } from './compile/downloader';
import { DEFAULT_TIMEOUT_MILISECONDS, UNSUPPORTED_VYPER_VERSIONS, VYPER_VERSION_ERROR } from './constants';
import { ZkSyncVyperPluginError } from './errors';

const TEMP_FILE_PREFIX = "tmp-";

export function zeroxlify(hex: string): string {
    hex = hex.toLowerCase();
    return hex.slice(0, 2) === '0x' ? hex : `0x${hex}`;
}

export function getZkvyperUrl(repo: string, version: string, isRelease: boolean = true): string {
    // @ts-ignore
    const platform = { darwin: 'macosx', linux: 'linux', win32: 'windows' }[process.platform];
    // @ts-ignore
    const toolchain = { linux: '-musl', win32: '-gnu', darwin: '' }[process.platform];
    const arch = process.arch == 'x64' ? 'amd64' : process.arch;
    const ext = process.platform == 'win32' ? '.exe' : '';

    if (isRelease) {
        return `${repo}/releases/download/v${version}/zkvyper-${platform}-${arch}${toolchain}-v${version}${ext}`;
    }

    return `${repo}/raw/main/${platform}-${arch}/zkvyper-${platform}-${arch}${toolchain}-v${version}${ext}`;
}

export function pluralize(n: number, singular: string, plural?: string) {
    if (n === 1) {
        return singular;
    }

    if (plural !== undefined) {
        return plural;
    }

    return `${singular}s`;
}

export function isURL(url: string): boolean {
    try {
        const locator = new URL(url);
        return locator.protocol === 'http:' || locator.protocol === 'https:';
    } catch (e) {
        return false;
    }
}

export function isVersionInRange(version: string, versionInfo: CompilerVersionInfo): boolean {
    const latest = versionInfo.latest;
    const minVersion = versionInfo.minVersion;

    return semver.gte(version, minVersion) && semver.lte(version, latest);
}

export function checkSupportedVyperVersions(vyper: MultiVyperConfig) {
    vyper.compilers.forEach((compiler) => {
        if (UNSUPPORTED_VYPER_VERSIONS.includes(compiler.version)) {
            throw new ZkSyncVyperPluginError(VYPER_VERSION_ERROR);
        }
    });
}

function resolveTempFileName(filePath: string): string {
    const { dir, ext, name } = path.parse(filePath);

    return path.format({
        dir,
        ext,
        name: `${TEMP_FILE_PREFIX}${name}`,
    });
}

export async function download(
    url: string,
    filePath: string,
    userAgent: string,
    version: string,
    timeoutMillis = DEFAULT_TIMEOUT_MILISECONDS,
    extraHeaders: { [name: string]: string } = {}
) {
    const { pipeline } = await import("stream");
    const streamPipeline = util.promisify(pipeline);

    const response = await pureDownload(url, userAgent, version, timeoutMillis, extraHeaders);

    const tmpFilePath = resolveTempFileName(filePath);
    await fse.ensureDir(path.dirname(filePath));

    await streamPipeline(response, fs.createWriteStream(tmpFilePath));
    return fse.move(tmpFilePath, filePath, { overwrite: true });
}

export async function pureDownload( url: string,
    userAgent: string,
    version: string,
    timeoutMillis = DEFAULT_TIMEOUT_MILISECONDS,
    extraHeaders: { [name: string]: string } = {}): Promise<any> {

    const { getGlobalDispatcher, request } = await import("undici");
    let dispatcher: Dispatcher = getGlobalDispatcher();

    try {
    const response = await request(url, {
        dispatcher,
        headersTimeout: timeoutMillis,
        maxRedirections: 10,
        method: "GET",
        headers: {
            ...extraHeaders,
            "User-Agent": `${userAgent} ${version}`,
        },
    });

        return response.body;
    } catch (error: any) {
        if (error.response) {
            // The request was made and the server responded with a status code outside of the range of 2xx
            throw new ZkSyncVyperPluginError(
                `Failed to download from ${url}. Status: ${
                    error.response.status
                }, Data: ${JSON.stringify(error.response.data)}`
            );
        } else if (error.request) {
            // The request was made but no response was received
            throw new ZkSyncVyperPluginError(`No response received from url ${url}. Error: ${error.message}`);
        } else {
            // Something happened in setting up the request that triggered an Error
            throw new ZkSyncVyperPluginError(`Failed to set up the request for ${url}: ${error.message}`);
        }
    }
}

export async function getRelease(owner: string, 
    repo: string, 
    userAgent: string, 
    tag: string = 'latest',  
    timeoutMillis = DEFAULT_TIMEOUT_MILISECONDS): Promise<any> {
    let url = `https://api.github.com/repos/${owner}/${repo}/releases/`;
    url = tag != 'latest' ? url + `tags/${tag}` : url + `latest`;

    let release = await pureDownload(url, userAgent, '', timeoutMillis);
    return release.json();
}

export async function saveDataToFile(data: any, targetPath: string) {
    await fse.ensureDir(path.dirname(targetPath));
    await fse.writeJSON(targetPath, data, { spaces: 2 });
}