// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import "./Empty.sol";


contract FactoryUups is Initializable, UUPSUpgradeable, OwnableUpgradeable  {
    address[] public deployedContracts;

    function initialize() public initializer{
        __Ownable_init();
        __UUPSUpgradeable_init();
        deployEmptyContract();
    }

    function deployEmptyContract() public {
        EmptyContract newContract = new EmptyContract();
        deployedContracts.push(address(newContract));
    }

    function getNumberOfDeployedContracts() public view returns (uint) {
        return deployedContracts.length;
    }

    function storeNothing() public pure {
        
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
