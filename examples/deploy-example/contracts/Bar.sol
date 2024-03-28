// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

import "./Foo.sol";

contract Bar {
    Foo public foo = new Foo();
}
