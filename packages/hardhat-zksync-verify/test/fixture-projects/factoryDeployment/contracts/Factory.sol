// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Child.sol";

contract Factory {
    Child[] public deployedChildren;

    event ChildDeployed(address childAddress, uint256 initialValue);

    function deployChild(uint256 _initialValue) public returns (address) {
        Child child = new Child(_initialValue);
        deployedChildren.push(child);
        emit ChildDeployed(address(child), _initialValue);
        return address(child);
    }

    function getDeployedChildren() public view returns (Child[] memory) {
        return deployedChildren;
    }
}
