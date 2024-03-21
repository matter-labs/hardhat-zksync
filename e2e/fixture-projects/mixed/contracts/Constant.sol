// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

contract Constant {
    uint c = 42;
    constructor() {}

    function getValue() public view returns (uint) {
        return c;
    }
}
