// SPDX-License-Identifier: MIT

pragma solidity >=0.4.22 <0.9.0;

contract Greeter {
    string greeting;
    
    constructor(string memory _greeting) {
        greeting = _greeting;
    }

    function greet() public view returns (string memory) {
        return greeting;
    }

}
