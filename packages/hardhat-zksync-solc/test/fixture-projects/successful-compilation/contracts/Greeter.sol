// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.7.6;
pragma abicoder v2;

contract Greeter {

    string greeting;
    string bad;
    constructor(string memory _greeting) {
        greeting = _greeting;
        bad = "baaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad";
    }

    function greet() public view returns (string memory) {
        return greeting;
    }

}
