// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;
import "./ChildChildLib.sol";
library ChildLib {

    using ChildChildLib for uint;

    function plus(uint a, uint b) public view returns (uint, address) {
        return (a.plus(b), address(this));
    }
}