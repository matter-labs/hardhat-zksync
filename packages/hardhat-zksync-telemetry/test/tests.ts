import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

import { Telemetry } from "@matterlabs/zksync-telemetry-js";

chai.use(sinonChai);

describe('hardhat-zksync-telemetry', () => {
    beforeEach(() => {
        proxyquire('../src', {
            'hardhat/config': { extendEnvironment: sinon.stub() }
        });
    });

    it('returns telemetry instance', () => {
        const instance = require("../src");
        expect(instance.default).to.be.instanceOf(Telemetry);
    });

    it('returns the same telemetry instance every time', () => {
        const instance1 = require("../src");
        const instance2 = require("../src");
        expect(instance1.default).to.be.eq(instance2.default);
    });
});
