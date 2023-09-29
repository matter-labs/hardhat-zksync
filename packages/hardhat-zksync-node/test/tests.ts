import { assert } from 'chai';
import chalk from 'chalk';

import { TASK_NODE_ZKSYNC } from '../src/constants';

import { useEnvironment } from './helpers';

describe('zksolc plugin', async function () {
    describe('Simple', async function () {
        useEnvironment('simple');

        it('Should successfully compile a simple contract', async function () {
            await this.env.run(TASK_NODE_ZKSYNC);
        });
    });
});
