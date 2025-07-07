// contracts/Box.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract BoxWithStorageGapV2 is Initializable {
    uint256 private value;
    uint256 private secondValue;
    uint256 private thirdValue;
    uint256 private fourthValue;
    uint256 private fifthValue;
    address private newAddress;
    uint256[10] private __gap;

    // Emitted when the stored value changes
    event ValueChanged(uint256 newValue);

    function initialize(uint256 initValue) public initializer {
        value = initValue;
    }

    // Stores a new value in the contract
    function store(uint256 newValue) public {
        value = newValue;
        emit ValueChanged(newValue);
    }

    // Reads the last stored value and returns it with a prefix
    function retrieve() public view returns (string memory) {
        return string(abi.encodePacked("V2: ", _uint2str(value)));
    }

    // Converts a uint to a string
    function _uint2str(uint256 _i) private pure returns (string memory str) {
        if (_i == 0) return "0";
        uint256 j = _i; uint256 len;
        while (j != 0) { len++; j /= 10; }
        bytes memory b = new bytes(len);
        while (_i != 0) { len--; b[len] = bytes1(uint8(48 + _i % 10)); _i /= 10; }
        str = string(b);
    }
}
