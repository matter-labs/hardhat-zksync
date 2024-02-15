import { supportBigNumber } from '@nomicfoundation/hardhat-chai-matchers/internal/bigNumber';
import { supportEmit } from '@nomicfoundation/hardhat-chai-matchers/internal/emit';
import { supportHexEqual } from '@nomicfoundation/hardhat-chai-matchers/internal/hexEqual';
import { supportProperAddress } from '@nomicfoundation/hardhat-chai-matchers/internal/properAddress';
import { supportProperHex } from '@nomicfoundation/hardhat-chai-matchers/internal/properHex';
import { supportProperPrivateKey } from '@nomicfoundation/hardhat-chai-matchers/internal/properPrivateKey';
import { supportWithArgs } from '@nomicfoundation/hardhat-chai-matchers/internal/withArgs';

import { supportChangeEtherBalance } from './changeEtherBalance';
import { supportChangeEtherBalances } from './changeEtherBalances';
import { supportChangeTokenBalance } from './changeTokenBalance';
import { supportReverted } from './reverted/reverted';
import { supportRevertedWith } from './reverted/revertedWith';
import { supportRevertedWithCustomError } from './reverted/revertedWithCustomError';
import { supportRevertedWithoutReason } from './reverted/revertedWithoutReason';
import { supportRevertedWithPanic } from './reverted/revertedWithPanic';

export function hardhatChaiMatchers(chai: Chai.ChaiStatic, chaiUtils: Chai.ChaiUtils) {
    supportBigNumber(chai.Assertion, chaiUtils);
    supportEmit(chai.Assertion, chaiUtils);
    supportHexEqual(chai.Assertion);
    supportProperAddress(chai.Assertion);
    supportProperHex(chai.Assertion);
    supportProperPrivateKey(chai.Assertion);
    supportChangeEtherBalance(chai.Assertion,chaiUtils);
    supportChangeEtherBalances(chai.Assertion,chaiUtils);
    supportChangeTokenBalance(chai.Assertion,chaiUtils);
    supportReverted(chai.Assertion,chaiUtils);
    supportRevertedWith(chai.Assertion,chaiUtils);
    supportRevertedWithCustomError(chai.Assertion, chaiUtils);
    supportRevertedWithPanic(chai.Assertion,chaiUtils);
    supportRevertedWithoutReason(chai.Assertion,chaiUtils);
    supportWithArgs(chai.Assertion, chaiUtils);
}
