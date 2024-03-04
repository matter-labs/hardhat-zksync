// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

import "./Bar.sol";

contract Import {
    Bar public bar = new Bar();

    constructor(){

    }
    function getFooName() public view returns (string memory) {
        return bar.foo().name();
    }
}
