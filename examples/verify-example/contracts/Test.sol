//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./interfaces/ITest.sol";

contract Test is ITest {
    function example() pure external {
        return;
    }
}