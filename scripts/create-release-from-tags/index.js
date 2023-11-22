import { Command } from 'commander';
import spawn from '@npmcli/promise-spawn';
import getPackages from 'get-monorepo-packages';
import path from 'path';
import fs from 'fs';

/**
 *
 * @returns list of tags based on package name
 * @example ["@matterlabs/hardhat-zksync-solc@0.3.15", "@matterlabs/hardhat-zksync-solc@0.3.16"]
 */
const getCurrentGitTagsForPackage = async (packageName) => {
    const { stdout, stderr, code } = await spawn('git', [
        'tag',
        '--points-at',
        'HEAD',
        '--column',
    ]);

    if (code !== 0) {
        throw new Error(stderr.toString());
    }

    return parseRawTags(stdout.toString(), packageName);
};

const getChangelogPath = (packageName) => {
    const result = getPackages('.').find((p) => p.package.name.includes(packageName));
    if (!result) {
        throw new Error(`could not find package with name: ${packageName}.`);
    }

    let changelogPath;
    for (const fileName of ['CHANGELOG.MD', 'CHANGELOG.md']) {
        const myPath = path.join(result.location, fileName);
        const pathExists = fs.existsSync(myPath);
        if (pathExists) {
            changelogPath = myPath;
            break;
        }
    }

    if (!changelogPath) {
        console.log(`could not find changelog path for ${result.location}`);
    }

    return changelogPath;
};

/**
 *
 * @returns list of tags
 * @example ["@matterlabs/hardhat-zksync-solc@0.3.16", "@matterlabs/hardhat-zksync-deploy@0.6.3"]
 */
const createGithubRelease = async (tag, releaseNotes) => {
    let args = ['release', 'create', tag, '--title', tag, --notes, releaseNotes || ''];

    if(tag.includes("alpha") || tag.includes("beta")) {
        args.push('--prerelease');
    }
    
    const { stderr, code } = await spawn('gh', args);

    if (code !== 0) {
        throw new Error(stderr.toString());
    }
};

/**
 *
 * @param rawTag - ex. "@matterlabs/hardhat-zksync-solc@0.3.16"
 */
const extractPartsFromTag = (rawTag) => {
    const [name, version] = rawTag.split(/@(\d.*)/);
    if (!name || !version) {
        return undefined;
    }

    return {
        name,
        versionNumber: version?.replace('\n', ''),
        raw: rawTag,
    };
};

/**
 * Removes nullish values.
 */
const exists = (value) => {
    return value != null && value !== undefined;
};

/**
 *
 * @param rawTags - string delimited list of tags (e.g. `@matterlabs/hardhat-zksync-solc@0.3.16 @matterlabs/hardhat-zksync-deploy@0.6.3`)
 */
const parseRawTags = (rawTags, packageName) => {
    let tags = rawTags.trim().split(' ').map(extractPartsFromTag).filter(exists);

    if (packageName) {
        tags = tags.filter((tag) => tag.name.includes(packageName));
    }

    return tags;
};

/**
 *
 * @returns the release notes that correspond to a given tag.
 */
export const parseReleaseNotes = (
    changelogText,
    versionNumber
) => {
    const h2tag = /(##\s.*\d.*)/gi;
    let begin;
    let end;

    changelogText.split('\n').forEach((line, idx) => {
        if (begin && end) {
            return;
        }
        if (line.includes(versionNumber)) {
            begin = idx + 1;
        } else if (begin && h2tag.test(line)) {
            end = idx - 1;
        }
    });

    const result = changelogText.split('\n').filter((_, idx) => {
        return idx >= begin && idx <= (end ?? Infinity);
    });

    return result.join('\n');
};

const getReleaseNotes = (tag) => {
    const { name, versionNumber } = tag;
    const changelogPath = getChangelogPath(name);
    if (!changelogPath) {
        console.log(`no changelog path for ${name}... skipping.`);
        return;
    }

    const changelogText = fs.readFileSync(changelogPath, { encoding: 'utf8' });
    const releaseNotes = parseReleaseNotes(changelogText, versionNumber);
    if (!releaseNotes) {
        console.log(
            `Could not find release notes for tags ${tag.raw} in ${changelogPath}.`
        );
    };

    return releaseNotes;
};

const createGithubReleaseFromTag = async (tag) => {
    const notes = getReleaseNotes(tag);
    if (notes) {
        console.log(
            `\n ---> Outputting release titled: ${tag.raw} with notes: \n ${notes}`
        )
    }

    await createGithubRelease(tag.raw, notes);
};

const createReleaseFromTags = async (tags) => {
    console.log('Processing tags:', tags, '\n');

    for (const tag of tags) {
        await createGithubReleaseFromTag(tag);
    }
};

export async function main() {
    const program = new Command();

    program
        .name('create-github-release-from-tags')
        .option('-p, --package <package>', 'Package name to create release for')
        .action(async (cmd) => {
            const tags = await getCurrentGitTagsForPackage(cmd.package);
            return createReleaseFromTags(tags);
        });

    await program.parseAsync(process.argv);
}
