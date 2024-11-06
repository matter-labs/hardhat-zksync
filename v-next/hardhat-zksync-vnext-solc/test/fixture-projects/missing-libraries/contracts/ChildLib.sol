// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
import "./ChildChildLib.sol";
library ChildLib {

    using ChildChildLib for uint;

    function plus(uint a, uint b) public view returns (uint, address) {
        return (a.plus(b), address(this));
    }
}