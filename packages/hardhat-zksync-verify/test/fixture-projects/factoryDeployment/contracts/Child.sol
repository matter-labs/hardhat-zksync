// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Child {
    uint256 public value;
    address public deployer;

    constructor(uint256 _initialValue) {
        value = _initialValue;
        deployer = msg.sender;
    }

    function setValue(uint256 _newValue) public {
        value = _newValue;
    }

    function getValue() public view returns (uint256) {
        return value;
    }
}
