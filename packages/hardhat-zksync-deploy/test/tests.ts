import { assert } from 'chai';
import * as path from 'path';
import { callDeployScripts, findDeployScripts } from '../src/plugin';
import { TASK_DEPLOY_ZKSYNC } from '../src/task-names';
import { useEnvironment } from './helpers';

describe('Plugin tests', async function () {
    describe('successful-compilation artifact', async function () {
        useEnvironment('successful-compilation');

        it('Should load artifacts', async function () {
            const artifactExists = await this.env.artifacts.artifactExists('Greeter');
            assert(artifactExists, "Greeter artifact doesn't exist");

            const artifact = await this.env.artifacts.readArtifact('Greeter');
            assert.equal(artifact._format, 'hh-zksolc-artifact-1', 'Incorrect artifact build');

            // Check that we can load an additional key (it turns that we can which is great).
            assert.equal((artifact as any)._additionalKey, 'some_value', 'Additional key not loaded!');
        });

        it('Should find deploy scripts', async function () {
            const baseDir = this.env.config.paths.root;
            const files = findDeployScripts(this.env);

            assert.deepEqual(files, [path.join(baseDir, 'deploy', '001_deploy.ts')], 'Incorrect deploy script list');
        });

        it('Should call deploy scripts', async function () {
            await callDeployScripts(this.env, '');
        });

        it('Should call deploy scripts through HRE', async function () {
            await this.env.run(TASK_DEPLOY_ZKSYNC);
        });
    });
});
