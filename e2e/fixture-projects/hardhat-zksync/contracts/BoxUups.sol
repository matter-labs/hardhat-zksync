// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

contract BoxUups is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    uint256 private value;
    uint256 private secondValue;
    uint256 private thirdValue;

    function initialize(uint256 initValue) public initializer {
        value = initValue;
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    // Reads the last stored value
    function retrieve() public view returns (uint256) {
        return value;
    }

    // Stores a new value in the contract
    function store(uint256 newValue) public {
        value = newValue;
        emit ValueChanged(newValue);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    // Emitted when the stored value changes
    event ValueChanged(uint256 newValue);
}
