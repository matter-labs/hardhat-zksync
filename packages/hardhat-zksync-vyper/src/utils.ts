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
    timeoutMillis = 10000,
    extraHeaders: { [name: string]: string } = {}
) {
    const { pipeline } = await import("stream");
    const { getGlobalDispatcher, request } = await import("undici");
    const streamPipeline = util.promisify(pipeline);

    let dispatcher: Dispatcher = getGlobalDispatcher();

    // Fetch the url
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

    if (response.statusCode >= 200 && response.statusCode <= 299) {
        const tmpFilePath = resolveTempFileName(filePath);
        await fse.ensureDir(path.dirname(filePath));

        await streamPipeline(response.body, fs.createWriteStream(tmpFilePath));
        return fse.move(tmpFilePath, filePath, { overwrite: true });
    }

    // undici's response bodies must always be consumed to prevent leaks
    const text = await response.body.text();

    // eslint-disable-next-line
    throw new Error(
        `Failed to download ${url} - ${response.statusCode} received. ${text}`
    );
}

export async function getLatestRelease(owner: string, repo: string, userAgent: string, timeout: number = DEFAULT_TIMEOUT_MILISECONDS): Promise<any> {
    let url = `https://github.com/${owner}/${repo}/releases/latest`;
    let redirectUrlPattern = `https://github.com/${owner}/${repo}/releases/tag/v`

    const { request } = await import("undici");

    const response = await request(url, {
        headersTimeout: timeout,
        maxRedirections: 0,
        method: "GET",
        headers: {
            "User-Agent": `${userAgent}`,
        },
    });

    // Check if the response is a redirect
    if (response.statusCode >= 300 && response.statusCode < 400) {
        // Get the URL from the 'location' header
        if (response.headers.location) {
            // Check if the redirect URL matches the expected pattern
            if (response.headers.location.startsWith(redirectUrlPattern)) {
                // Extract the tag from the redirect URL
                return response.headers.location.substring(redirectUrlPattern.length);
            }

            throw new ZkSyncVyperPluginError(`Unexpected redirect URL: ${response.headers.location} for URL: ${url}`);
        } else {
            // Throw an error if the 'location' header is missing in a redirect response
            throw new ZkSyncVyperPluginError(`Redirect location not found for URL: ${url}`);
        }
    } else {
        // Throw an error for non-redirect responses
        throw new ZkSyncVyperPluginError(`Unexpected response status: ${response.statusCode} for URL: ${url}`);
    }
}

export async function saveDataToFile(data: any, targetPath: string) {
    await fse.ensureDir(path.dirname(targetPath));
    await fse.writeJSON(targetPath, data, { spaces: 2 });
}