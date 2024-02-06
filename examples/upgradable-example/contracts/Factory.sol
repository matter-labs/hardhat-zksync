// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EmptyContract {
}

contract Factory {
    address[] public deployedContracts;

    function initialize() public{
        deployEmptyContract();
    }

    function deployEmptyContract() public {
        EmptyContract newContract = new EmptyContract();
        deployedContracts.push(address(newContract));
    }

    function getNumberOfDeployedContracts() public view returns (uint) {
        return deployedContracts.length;
    }
}
