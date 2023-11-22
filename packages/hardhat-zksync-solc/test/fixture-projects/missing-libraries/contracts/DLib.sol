// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
library DLib {

    function multiply(uint a, uint b) public view returns (uint, address) {
        return (a * b, address(this));
    }
}