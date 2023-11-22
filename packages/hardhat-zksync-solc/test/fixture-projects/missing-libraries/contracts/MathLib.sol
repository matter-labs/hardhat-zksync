// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
import "./ChildLib.sol";
library MathLib {

    using ChildLib for uint;

    function multiply(uint a, uint b) public view returns (uint, address) {
        return (a * b, address(this));
    }

    function plus(uint a, uint b) public view returns (uint, address) {
        return a.plus(b);
    }
}