import { parseReleaseNotes } from '../create-release-from-tags/index.js';
import fs from 'fs';
import path from 'path';
import { expect } from 'chai';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const readFixture = (filename) => {
    return fs.readFileSync(path.join(__dirname, 'fixtures', filename), { encoding: 'utf8' });
};

describe('parseReleaseNotes', () => {
    it('should parse release notes from changelog for specific version', () => {
        const changelogText = readFixture('CHANGELOG.md');

        const releaseNotes = parseReleaseNotes(changelogText, '0.1.3');

        expect(releaseNotes).to.be.equal('\n### Minor Changes\n\n- 6fdd34b: Change 2\n- 7fdd34b: Change 3\n\n### Patch Changes\n\n- Change 4 [#235](https://github.com/matter-labs/hardhat-zksync/pull/235) [e63173](https://github.com/matter-labs/hardhat-zksync/pull/235/commits/e631737f79ed76b4772c4869af131740e96acea4)\n');
    });
});
