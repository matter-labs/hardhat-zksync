// SPDX-License-Identifier: MIT

pragma solidity >=0.4.22 <0.9.0;

contract Greeter {

    string greeting;
    string bad;
    constructor(string memory _greeting) {
        greeting = _greeting;
    }

    function payGreet(address payable a) public payable returns (bool memory) {
        require(a != address(0), "Invalid address");
        bool success = a.send(1);
        return success;
    }

}
