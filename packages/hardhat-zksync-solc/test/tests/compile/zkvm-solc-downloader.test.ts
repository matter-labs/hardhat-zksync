import { expect } from 'chai';
import sinon, { SinonStub } from 'sinon';
import { fail } from 'assert';
import { ZkVmSolcCompilerDownloader } from '../../../src/compile/zkvm-solc-downloader';

describe('ZkVmSolcCompilerDownloader', () => {
    const solcVersion = '0.8.17';
    const zkVmSolcVersion = '0.0.0';
    const compilersDir = '/path/to/compilers';

    describe('getDownloaderWithVersionValidated', () => {
        it('should return an instance of ZkVmSolcCompilerDownloader', async () => {
            const downloader = await ZkVmSolcCompilerDownloader.getDownloaderWithVersionValidated(
                zkVmSolcVersion,
                solcVersion,
                compilersDir,
            );

            expect(downloader).to.be.an.instanceOf(ZkVmSolcCompilerDownloader);
        });

        it('should return the same instance when called multiple times', async () => {
            const downloader1 = await ZkVmSolcCompilerDownloader.getDownloaderWithVersionValidated(
                zkVmSolcVersion,
                solcVersion,
                compilersDir,
            );
            const downloader2 = await ZkVmSolcCompilerDownloader.getDownloaderWithVersionValidated(
                zkVmSolcVersion,
                solcVersion,
                compilersDir,
            );

            expect(downloader1).to.equal(downloader2);
            expect(downloader1.getSolcVersion()).to.equal(solcVersion);
            expect(downloader1.getZkVmSolcVersion()).to.equal(zkVmSolcVersion);

            const downloader3 = await ZkVmSolcCompilerDownloader.getDownloaderWithVersionValidated(
                '0.0.1',
                solcVersion,
                compilersDir,
            );

            expect(downloader1).to.not.equal(downloader3);
            expect(downloader3.getSolcVersion()).to.equal(solcVersion);
            expect(downloader3.getZkVmSolcVersion()).to.equal('0.0.1');

            const downloader4 = await ZkVmSolcCompilerDownloader.getDownloaderWithVersionValidated(
                zkVmSolcVersion,
                '0.8.18',
                compilersDir,
            );

            expect(downloader1).to.not.equal(downloader4);
            expect(downloader4.getSolcVersion()).to.equal('0.8.18');
            expect(downloader4.getZkVmSolcVersion()).to.equal(zkVmSolcVersion);

            const downloader5 = await ZkVmSolcCompilerDownloader.getDownloaderWithVersionValidated(
                '0.0.1',
                '0.8.18',
                compilersDir,
            );

            expect(downloader1).to.not.equal(downloader5);
            expect(downloader5.getSolcVersion()).to.equal('0.8.18');
            expect(downloader5.getZkVmSolcVersion()).to.equal('0.0.1');

        });
    });

    describe('getSolcVersion', () => {
        it('should return the solc version', async () => {
            const downloader = await ZkVmSolcCompilerDownloader.getDownloaderWithVersionValidated(
                zkVmSolcVersion,
                solcVersion,
                compilersDir,
            );

            const result = downloader.getSolcVersion();

            expect(result).to.equal(solcVersion);
        });
    });

    describe('getZkVmSolcVersion', () => {
        it('should return the zkvm-solc version', async () => {
            const downloader = await ZkVmSolcCompilerDownloader.getDownloaderWithVersionValidated(
                zkVmSolcVersion,
                solcVersion,
                compilersDir,
            );

            const result = downloader.getZkVmSolcVersion();

            expect(result).to.equal(zkVmSolcVersion);
        });
    });

    describe('getVersion', () => {
        it('should return the combined version', async () => {
            const downloader = await ZkVmSolcCompilerDownloader.getDownloaderWithVersionValidated(
                zkVmSolcVersion,
                solcVersion,
                compilersDir,
            );

            const result = downloader.getVersion();

            expect(result).to.equal(`${solcVersion}-${zkVmSolcVersion}`);
        });
    });

    describe('getDownloaderWithVersionValidated', () => {
        const sandbox = sinon.createSandbox();

        let downloadCompilerStub: SinonStub;
        let postProcessCompilerDownloadStub: SinonStub;
        let verifyCompilerStub: SinonStub;

        beforeEach(() => {
            downloadCompilerStub = sandbox
                .stub(ZkVmSolcCompilerDownloader.prototype as any, '_downloadCompiler')
                .resolves();
            postProcessCompilerDownloadStub = sandbox
                .stub(ZkVmSolcCompilerDownloader.prototype as any, '_postProcessCompilerDownload')
                .resolves();
            verifyCompilerStub = sandbox
                .stub(ZkVmSolcCompilerDownloader.prototype as any, '_verifyCompiler')
                .resolves();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should download the zkvm-solc compiler', async () => {
            const downloader = await ZkVmSolcCompilerDownloader.getDownloaderWithVersionValidated(
                zkVmSolcVersion,
                solcVersion,
                compilersDir,
            );

            await downloader.downloadCompiler();

            sandbox.assert.calledOnce(downloadCompilerStub);
            sandbox.assert.calledOnce(postProcessCompilerDownloadStub);
            sandbox.assert.calledOnce(verifyCompilerStub);
        });

        it('should download the zkvm-solc compiler', async () => {
            downloadCompilerStub.throws(new Error('Compiler not found'));
            const downloader = await ZkVmSolcCompilerDownloader.getDownloaderWithVersionValidated(
                zkVmSolcVersion,
                solcVersion,
                compilersDir,
            );

            try {
                await downloader.downloadCompiler();
                fail('Should have thrown');
            } catch (e: any) {
                expect(e.message).to.equal('Compiler not found');
            }

            sandbox.assert.calledOnce(downloadCompilerStub);
        });
    });
});
