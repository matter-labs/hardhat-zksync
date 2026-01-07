// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "./ComplexChild.sol";

/**
 * @title DeploymentLibrary
 * @notice Library for deploying child contracts (Issue #519 scenario)
 * @dev Tests verification when contracts are deployed via library functions
 */
library DeploymentLibrary {
    // Unique identifier
    uint256 public constant LIBRARY_ID = 0x11B123456789;

    event LibraryDeployment(address indexed deployed, address indexed caller);

    /**
     * @notice Deploy a ComplexChild contract via library
     * @dev This pattern fails verification in issue #519
     */
    function deployChild(
        string memory _name,
        uint256 _initialValue,
        address _owner
    ) external returns (address) {
        ComplexChild child = new ComplexChild(_name, _initialValue, _owner);
        address childAddress = address(child);

        emit LibraryDeployment(childAddress, msg.sender);

        return childAddress;
    }

    /**
     * @notice Compute CREATE2 address for a child contract
     */
    function computeCreate2Address(
        address _deployer,
        bytes32 _salt,
        string memory _name,
        uint256 _initialValue,
        address _owner
    ) external pure returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(ComplexChild).creationCode,
            abi.encode(_name, _initialValue, _owner)
        );

        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                _deployer,
                _salt,
                keccak256(bytecode)
            )
        );

        return address(uint160(uint256(hash)));
    }
}
