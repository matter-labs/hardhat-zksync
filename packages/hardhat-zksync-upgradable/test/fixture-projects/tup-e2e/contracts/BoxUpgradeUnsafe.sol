// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract BoxUpgradeUnsafe is Initializable {
    uint256 private value = 0;
    uint256 private immutable secondValue = 2;
    uint256 private constant thirdValue = 3;

    function initialize(uint256 initValue) public initializer {
        value = initValue;
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

    function delegate(address target, string calldata func, address to) public {
        (bool success, ) = target.delegatecall(abi.encodeWithSignature(func, to));
        require(success, 'Failed to delegate call');
    }

    // function destroy(address someAddress) public {
    //     selfdestruct(payable(someAddress)); // not supported by zksolc (produces compile-time error)
    // }

    // Emitted when the stored value changes
    event ValueChanged(uint256 newValue);
}
