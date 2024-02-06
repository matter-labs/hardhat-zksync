// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

contract EmptyContract {
}

contract FactoryUupsV2 is Initializable, UUPSUpgradeable, OwnableUpgradeable  {
    address[] public deployedContracts;

    function initialize() public initializer{
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
}