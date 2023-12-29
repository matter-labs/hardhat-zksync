// SPDX-License-Identifier: MIT

pragma solidity >=0.4.22 <0.9.0;

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
