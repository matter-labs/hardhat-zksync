import { expect } from 'chai';
import sinon from 'sinon';

import fs from 'fs';
import path from 'path';
import semver from 'semver';
import { TASK_DOWNLOAD_ZKSOLC, TASK_UPDATE_SOLIDITY_COMPILERS } from '../../src/constants';
import * as utils from '../../src/utils';
import * as compile from '../../src/compile/index';
import { compileLink } from '../../src/plugin';
import { getLibraryLink } from '../../src/utils';

describe('compile link', () => {
    let hre: any;
    before(() => {
        hre = {
            network: { zksync: true },
            config: {
                zksolc: { version: '1.0.0' },
                paths: { artifacts: 'artifacts' },
            },
            artifacts: {
                readArtifact: sinon.stub().resolves({ bytecode: '0x' }),
            },
            run: sinon.stub().resolves(),
        } as unknown as any;
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should throw an error if not on zkSync network', async () => {
        hre.network.zksync = false;

        try {
            await compileLink({ sourceName: 'Test', contractName: 'Test' }, hre);
        } catch (error: any) {
            expect(error.message).to.equal('This task is only available for zkSync network');
        }
    });

    it('should download zksolc and update solidity compilers', async () => {
        hre.network.zksync = true;

        await compileLink({ sourceName: 'Test', contractName: 'Test' }, hre);

        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(hre.run.calledWith(TASK_DOWNLOAD_ZKSOLC)).to.be.true;
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(hre.run.calledWith(TASK_UPDATE_SOLIDITY_COMPILERS)).to.be.true;
    });

    it('should return undefined if zksolc version is less than required', async () => {
        hre.config.zksolc.version = '0.1.0';
        hre.network.zksync = true;

        const result = await compileLink({ sourceName: 'Test', contractName: 'Test' }, hre);

        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(result).to.be.undefined;
    });

    it('should link libraries and return new bytecode', async () => {
        hre.network.zksync = true;
        sinon.stub(semver, 'lt').returns(false);
        sinon.stub(utils, 'generateFQN').returns('Test:Test');
        sinon.stub(path, 'join').returns('artifacts/Test/Test.zbin');
        sinon.stub(fs, 'writeFileSync');
        sinon.stub(fs, 'readFileSync').returns('0xnewbytecode');
        sinon.stub(utils, 'getLibraryLink').resolves({
            contractZbinPath: 'artifacts/Test/Test.zbin',
        });
        sinon.stub(compile, 'link').resolves({ unlinked: {}, ignored: {} });

        const result = await compileLink({ sourceName: 'Test', contractName: 'Test' }, hre);

        expect(result).to.equal('0xnewbytecode');
    });

    it('should throw an error if libraries are not linked', async () => {
        hre.network.zksync = true;
        sinon.stub(semver, 'lt').returns(false);
        sinon.stub(utils, 'generateFQN').returns('Test:Test');
        sinon.stub(path, 'join').returns('artifacts/Test/Test.zbin');
        sinon.stub(fs, 'writeFileSync');
        sinon.stub(utils, 'getLibraryLink').resolves({
            contractZbinPath: 'artifacts/Test/Test.zbin',
        });
        sinon.stub(compile, 'link').resolves({ unlinked: { 'artifacts/Test/Test.zbin': ['Lib'] }, ignored: {} });

        try {
            await compileLink({ sourceName: 'Test', contractName: 'Test' }, hre);
        } catch (error: any) {
            expect(error.message).to.include('Libraries for contract Test:Test are not linked');
        }
    });

    it('should warn if some libraries are ignored', async () => {
        hre.network.zksync = true;
        const consoleWarnStub = sinon.stub(console, 'warn');
        sinon.stub(semver, 'lt').returns(false);
        sinon.stub(utils, 'generateFQN').returns('Test:Test');
        sinon.stub(path, 'join').returns('artifacts/Test/Test.zbin');
        sinon.stub(fs, 'writeFileSync');
        sinon.stub(fs, 'readFileSync').returns('0xnewbytecode');
        sinon.stub(utils, 'getLibraryLink').resolves({
            contractZbinPath: 'artifacts/Test/Test.zbin',
        });
        sinon.stub(compile, 'link').resolves({ unlinked: {}, ignored: { 'artifacts/Test/Test.zbin': ['Lib'] } });

        await compileLink({ sourceName: 'Test', contractName: 'Test' }, hre);

        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(consoleWarnStub.calledWith(sinon.match.string)).to.be.true;
    });
});

describe('getLibraryLink', () => {
    let hre: any;

    beforeEach(() => {
        hre = {
            artifacts: {
                readArtifact: sinon.stub(),
            },
        };
    });

    it('should return only contractZbinPath when libraries is undefined', async () => {
        const result = await getLibraryLink(hre, undefined, 'path/to/contract.zbin');
        expect(result).to.deep.equal({ contractZbinPath: 'path/to/contract.zbin' });
    });

    it('should return only contractZbinPath when libraries is empty', async () => {
        const result = await getLibraryLink(hre, {}, 'path/to/contract.zbin');
        expect(result).to.deep.equal({ contractZbinPath: 'path/to/contract.zbin' });
    });

    it('should populate libraries correctly', async () => {
        hre.artifacts.readArtifact
            .withArgs('Lib1')
            .resolves({ sourceName: 'contracts/Lib1.sol', contractName: 'Lib1' });
        hre.artifacts.readArtifact
            .withArgs('Lib2')
            .resolves({ sourceName: 'contracts/Lib2.sol', contractName: 'Lib2' });

        const libraries = {
            Lib1: '0x1234567890123456789012345678901234567890',
            Lib2: '0x0987654321098765432109876543210987654321',
        };

        const result = await getLibraryLink(hre, libraries, 'path/to/contract.zbin');

        expect(result).to.deep.equal({
            contractZbinPath: 'path/to/contract.zbin',
            libraries: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'contracts/Lib1.sol:Lib1': '0x1234567890123456789012345678901234567890',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'contracts/Lib2.sol:Lib2': '0x0987654321098765432109876543210987654321',
            },
        });
    });

    it('should handle errors when reading artifacts', async () => {
        hre.artifacts.readArtifact.withArgs('Lib1').rejects(new Error('Artifact not found'));

        const libraries = {
            Lib1: '0x1234567890123456789012345678901234567890',
        };

        try {
            await getLibraryLink(hre, libraries, 'path/to/contract.zbin');
        } catch (error: any) {
            expect(error.message).to.equal('Artifact not found');
        }
    });
});
