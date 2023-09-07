// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
pragma abicoder v2;

library DLib {

    function multiply(uint a, uint b) public view returns (uint, address) {
        return (a * b, address(this));
    }
}