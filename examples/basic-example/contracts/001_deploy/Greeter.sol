// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma abicoder v2;

contract Greeter {
    string greeting;
    constructor(string memory _greeting) {
        greeting = _greeting;
    }

    function greet() public view returns (string memory) {
        return greeting;
    }

    function setGreeting(string memory _greeting) public {
        greeting = _greeting;
    }
}
