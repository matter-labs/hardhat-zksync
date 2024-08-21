// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

contract Greeter {

    string greeting;
    constructor() {
        greeting = "Hello, World!";
    }

    function greet() public view returns (string memory) {
        return greeting;
    }

}
