// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

contract BoxUupsV2 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    uint256 private value;
    uint256 private secondValue;
    uint256 private thirdValue;

    function initialize(uint256 initValue) public initializer {
        value = initValue;
    }

    // Reads the last stored value and returns it with a prefix
    function retrieve() public view returns (string memory) {
        return string(abi.encodePacked('V2: ', uint2str(value)));
    }

    // Converts a uint to a string
    function uint2str(uint _i) internal pure returns (string memory) {
        if (_i == 0) {
            return '0';
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
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
