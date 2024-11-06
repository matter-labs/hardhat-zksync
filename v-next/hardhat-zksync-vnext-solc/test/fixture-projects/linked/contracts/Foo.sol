// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
pragma abicoder v2;

library Foo {
    string public constant name = "Foo";
    function answer() external pure returns (uint) {
        return 42;
    }
}
