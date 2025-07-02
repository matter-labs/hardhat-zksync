import { expect } from 'chai';
import sinon from 'sinon';
import fse from 'fs-extra';
import { ZksolcCompilerDownloader } from '../../../src/compile/downloader';
import { COMPILER_ZKSOLC_DEPRECATION_FOR_SOLC_VERSION, ZKSOLC_COMPILER_PATH_VERSION } from '../../../src/constants';

describe('Downloader', async () => {
    const sandbox = sinon.createSandbox();
    const pathEscape = process.env.PLATFORM_OS?.includes('windows') ? '\\' : '/';

    async function isCompilerDownloaded(isZksolcDownloaded: boolean): Promise<boolean> {
        return isZksolcDownloaded;
    }

    afterEach(() => {
        sandbox.restore();
        (ZksolcCompilerDownloader as any)._instance = undefined;
    });

    describe('getDownloaderWithVersionValidated', async () => {
        it('create downloader with specific version and with no download', async () => {
            sandbox
                .stub(ZksolcCompilerDownloader.prototype, 'isCompilerDownloaded')
                .returns(isCompilerDownloaded(false));
            const downloader = await ZksolcCompilerDownloader.getDownloaderWithVersionValidated('1.5.4', '', 'cache/');
            const compilerPath = downloader.getCompilerPath();
            const version = downloader.getVersion();
            const compilerDownloaded = await downloader.isCompilerDownloaded();

            expect(compilerPath.replaceAll(pathEscape, '/')).to.equal('cache/zksolc/zksolc-v1.5.4');
            expect(version).to.equal('1.5.4');
            expect(compilerDownloaded).to.equal(false);
        });

        it('create downloader with latest version and with no download of version info', async () => {
            const downloader = await ZksolcCompilerDownloader.getDownloaderWithVersionValidated('1.5.14', '', 'cache/');
            const compilerPath = downloader.getCompilerPath();
            const version = downloader.getVersion();

            expect(compilerPath.replaceAll(pathEscape, '/')).to.equal('cache/zksolc/zksolc-v1.5.14');
            expect(version).to.equal('1.5.14');
        });

        it('create downloader with remote version and with no download of version info', async () => {
            const downloader = await ZksolcCompilerDownloader.getDownloaderWithVersionValidated(
                ZKSOLC_COMPILER_PATH_VERSION,
                'zksolc/zksolc-custom',
                'cache/',
            );
            const compilerPath = downloader.getCompilerPath();
            const version = downloader.getVersion();

            expect(compilerPath.replaceAll(pathEscape, '/')).to.equal('zksolc/zksolc-custom');
            expect(version).to.equal(ZKSOLC_COMPILER_PATH_VERSION);
        });

        it('create downloader with remote version with URL compiler path', async () => {
            const downloader = await ZksolcCompilerDownloader.getDownloaderWithVersionValidated(
                ZKSOLC_COMPILER_PATH_VERSION,
                'http://example.com/zksolc',
                'cache/',
            );
            const compilerPath = downloader.getCompilerPath();
            const version = downloader.getVersion();

            expect(compilerPath.replaceAll(pathEscape, '/')).to.equal(
                'cache/zksolc/zksolc-remote-b2f43f92a73c853b1c1cd4cd578d3d8489c00d5d.0',
            );
            expect(version).to.equal(ZKSOLC_COMPILER_PATH_VERSION);
        });

        it('create downloader with remote version and with without compiler path', async () => {
            try {
                await ZksolcCompilerDownloader.getDownloaderWithVersionValidated(
                    ZKSOLC_COMPILER_PATH_VERSION,
                    '',
                    'cache/',
                );
            } catch (e: any) {
                expect(e.message).to.equal('The zksolc compiler path is not specified for local or remote origin.');
            }
        });

        it('create downloader with not remote version and with compiler path', async () => {
            try {
                await ZksolcCompilerDownloader.getDownloaderWithVersionValidated(
                    '1.5.14',
                    'zksolc/zksolc-custom',
                    'cache/',
                );
            } catch (e: any) {
                expect(e.message).to.equal(
                    `When a compiler path is provided, specifying a version of the zksolc compiler in Hardhat is not allowed. Please omit the version and try again.`,
                );
            }

            try {
                await ZksolcCompilerDownloader.getDownloaderWithVersionValidated(
                    '1.5.14',
                    'zksolc/zksolc-custom',
                    'cache/',
                );
            } catch (e: any) {
                expect(e.message).to.equal(
                    `When a compiler path is provided, specifying a version of the zksolc compiler in Hardhat is not allowed. Please omit the version and try again.`,
                );
            }
        });
    });

    describe('getCompilerPath', async () => {
        it('should return the configured compiler path if it exists', async () => {
            sandbox
                .stub(ZksolcCompilerDownloader.prototype, 'isCompilerDownloaded')
                .returns(isCompilerDownloaded(false));
            const downloader = await ZksolcCompilerDownloader.getDownloaderWithVersionValidated('1.4.15', '', 'cache/');
            const compilerPath = downloader.getCompilerPath();

            expect(compilerPath.replaceAll(pathEscape, '/')).to.equal('cache/zksolc/zksolc-v1.4.15');
        });

        it('should return the default compiler path with configured compiler path', async () => {
            const downloader = await ZksolcCompilerDownloader.getDownloaderWithVersionValidated(
                ZKSOLC_COMPILER_PATH_VERSION,
                'path/zksolc/zksolc-custom',
                'cache/',
            );
            const compilerPath = downloader.getCompilerPath();

            expect(compilerPath.replaceAll(pathEscape, '/')).to.equal('path/zksolc/zksolc-custom');
        });

        it('should return the compiler path when the compiler path is a URL', async () => {
            const downloader = await ZksolcCompilerDownloader.getDownloaderWithVersionValidated(
                ZKSOLC_COMPILER_PATH_VERSION,
                'http://example.com/zksolc',
                'cache/',
            );
            sandbox.stub(fse, 'pathExists').resolves(false);

            const result = downloader.getCompilerPath();
            expect(result.replaceAll(pathEscape, '/')).to.be.equal(
                'cache/zksolc/zksolc-remote-b2f43f92a73c853b1c1cd4cd578d3d8489c00d5d.0',
            );
        });
    });

    describe('isCompilerDownloaded', async () => {
        it('should return true if the compiler is downloaded and verified', async () => {
            const downloader = await ZksolcCompilerDownloader.getDownloaderWithVersionValidated(
                ZKSOLC_COMPILER_PATH_VERSION,
                'path/zksolc',
                'zksolc/0.1.0',
            );

            sandbox.stub(downloader as any, '_verifyCompilerAndSetVersionIfNeeded').resolves();
            sandbox.stub(fse, 'pathExists').resolves(true);

            const result = await downloader.isCompilerDownloaded();

            expect(result).to.be.equal(true);
        });

        it('should return true if the compiler is downloaded and verified when the compiler path is a URL', async () => {
            const downloader = await ZksolcCompilerDownloader.getDownloaderWithVersionValidated(
                ZKSOLC_COMPILER_PATH_VERSION,
                'http://example.com/zksolc',
                'zksolc/0.1.0',
            );

            sandbox.stub(downloader as any, '_verifyCompilerAndSetVersionIfNeeded').resolves();
            sandbox.stub(fse, 'pathExists').resolves(true);

            const result = await downloader.isCompilerDownloaded();

            expect(result).to.be.equal(true);
        });

        it('should return false if the compiler is not downloaded', async () => {
            const downloader = await ZksolcCompilerDownloader.getDownloaderWithVersionValidated('1.4.15', '', 'cache/');

            sandbox.stub(fse, 'pathExists').resolves(false);

            try {
                const _ = await downloader.isCompilerDownloaded();
            } catch (e: any) {
                expect(e.message).to.equal(
                    'The zksolc binary at path path/zksolc is corrupted. Please delete it and try again.',
                );
            }
        });

        it('should return false if the compiler is not downloaded when the compiler path is a URL', async () => {
            const downloader = await ZksolcCompilerDownloader.getDownloaderWithVersionValidated(
                ZKSOLC_COMPILER_PATH_VERSION,
                'http://example.com/zksolc',
                'cache/',
            );

            sandbox.stub(fse, 'pathExists').resolves(false);

            const result = await downloader.isCompilerDownloaded();
            expect(result).to.be.equal(false);
        });
    });

    describe('downloadCompiler', function () {
        it('should download the compiler if the version info is not available', async function () {
            const downloader = await ZksolcCompilerDownloader.getDownloaderWithVersionValidated('1.5.17', '', 'cache/');

            sandbox.stub(downloader as any, '_downloadCompiler').resolves();
            sandbox.stub(downloader as any, '_postProcessCompilerDownload').resolves();
            sandbox.stub(downloader as any, '_verifyCompilerAndSetVersionIfNeeded').resolves();

            await downloader.downloadCompiler();

            sinon.assert.calledOnce((downloader as any)._downloadCompiler);
            sinon.assert.calledOnce((downloader as any)._postProcessCompilerDownload);
            sinon.assert.calledOnce((downloader as any)._verifyCompilerAndSetVersionIfNeeded);
        });

        it('should throw an error if the compiler version is not in the specified range', async function () {
            try {
                const downloader = await ZksolcCompilerDownloader.getDownloaderWithVersionValidated(
                    '1.3.11',
                    '',
                    'zksolc/',
                );
                await downloader.downloadCompiler();
            } catch (e: any) {
                console.log(e.message);
                expect(e.message).to.equal(COMPILER_ZKSOLC_DEPRECATION_FOR_SOLC_VERSION('1.3.11'));
            }
        });

        it('should download the compiler and perform post-processing and verification', async function () {
            const downloader = await ZksolcCompilerDownloader.getDownloaderWithVersionValidated(
                '1.5.15',
                '',
                'zksolc/',
            );

            sandbox.stub(downloader as any, '_downloadCompiler').resolves();
            sandbox.stub(downloader as any, '_postProcessCompilerDownload').resolves();
            sandbox.stub(downloader as any, '_verifyCompilerAndSetVersionIfNeeded').resolves();
            const consoleInfoSpy = sandbox.spy(console, 'info');

            await downloader.downloadCompiler();

            sinon.assert.calledOnce((downloader as any)._postProcessCompilerDownload);
            sinon.assert.calledOnce((downloader as any)._verifyCompilerAndSetVersionIfNeeded);
            sinon.assert.calledWith(consoleInfoSpy.firstCall, sinon.match('Downloading zksolc 1.5.15'));

            sinon.assert.calledWith(
                consoleInfoSpy.secondCall,
                sinon.match('zksolc version 1.5.15 successfully downloaded'),
            );
        });

        it('should download the compiler and perform post-processing and verification when compiler is provided with URL', async function () {
            const downloader = await ZksolcCompilerDownloader.getDownloaderWithVersionValidated(
                ZKSOLC_COMPILER_PATH_VERSION,
                'http://example.com/zksolc',
                'cache/',
            );

            sandbox.stub(downloader as any, '_downloadCompiler').resolves();
            sandbox.stub(downloader as any, '_postProcessCompilerDownload').resolves();
            sandbox.stub(downloader as any, '_verifyCompilerAndSetVersionIfNeeded').resolves();
            const consoleInfoSpy = sandbox.spy(console, 'info');

            await downloader.downloadCompiler();

            sinon.assert.calledOnce((downloader as any)._postProcessCompilerDownload);
            sinon.assert.calledOnce((downloader as any)._verifyCompilerAndSetVersionIfNeeded);
            sinon.assert.calledWith(consoleInfoSpy.firstCall, sinon.match('Downloading zksolc from the remote origin'));

            sinon.assert.calledWith(
                consoleInfoSpy.secondCall,
                sinon.match('zksolc from the remote origin successfully downloaded'),
            );
        });
    });
});
