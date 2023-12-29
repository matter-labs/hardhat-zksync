import { expect } from 'chai';
import sinon from 'sinon';
import { ZksolcCompilerDownloader } from '../../../src/compile/downloader';

describe('Downloader', async () => {
    const sandbox = sinon.createSandbox();

    async function isCompilerDownloaded(isZksolcDownloaded: boolean): Promise<boolean> {
        return isZksolcDownloaded;
    }

    beforeEach(() => {
        sandbox.stub(ZksolcCompilerDownloader.prototype, 'downloadCompiler').resolves();
        sandbox.stub(ZksolcCompilerDownloader.prototype, 'getVersion').returns('0.1.0');
    });

    afterEach(() => {
        sandbox.restore();
    });

    after(() => {
        (ZksolcCompilerDownloader as any)._instance = undefined;
    });

    describe('getCompilerPath', async () => {
        it('should return the configured compiler path if it exists', async () => {
            sandbox
                .stub(ZksolcCompilerDownloader as any, '_getCompilerVersionInfo')
                .resolves({ latest: '0.1.0', minVersion: '0.0.1' });
            sandbox
                .stub(ZksolcCompilerDownloader.prototype, 'isCompilerDownloaded')
                .returns(isCompilerDownloaded(false));
            sandbox.stub(ZksolcCompilerDownloader as any, '_shouldDownloadCompilerVersionInfo').resolves(false);
            const downloader = await ZksolcCompilerDownloader.getDownloaderWithVersionValidated(
                '0.1.0',
                'path/zksolc',
                'zksolc/0.1.0',
            );
            const compilerPath = downloader.getCompilerPath();

            expect(compilerPath).to.equal('path/zksolc');
        });

        it('should return the default compiler path with salt if no configured compiler path', async () => {
            sandbox
                .stub(ZksolcCompilerDownloader as any, '_getCompilerVersionInfo')
                .resolves({ latest: '0.1.0', minVersion: '0.0.1' });
            sandbox
                .stub(ZksolcCompilerDownloader.prototype, 'isCompilerDownloaded')
                .returns(isCompilerDownloaded(false));
            sandbox.stub(ZksolcCompilerDownloader as any, '_shouldDownloadCompilerVersionInfo').resolves(false);
            const downloader = await ZksolcCompilerDownloader.getDownloaderWithVersionValidated(
                '0.1.0',
                'path/zksolc',
                'zksolc/0.1.0',
            );
            const compilerPath = downloader.getCompilerPath();

            expect(compilerPath).to.equal('path/zksolc');
        });
    });
});
