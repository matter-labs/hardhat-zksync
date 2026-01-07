// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "./ComplexChild.sol";
import "./DeploymentLibrary.sol";

/**
 * @title AdvancedFactory
 * @notice Tests multiple factory deployment scenarios from issues #350, #362, #519
 * @dev Includes: direct deployment, CREATE2, and library-based deployment
 */
contract AdvancedFactory {
    // Unique identifier to avoid matching other contracts
    string public constant VERSION = "FactoryVerificationTest_v1.0_2024";
    uint256 public constant FACTORY_ID = 0xFAC704123456;

    ComplexChild[] public deployedChildren;
    mapping(address => bool) public isDeployed;

    event ChildDeployed(
        address indexed childAddress,
        string name,
        uint256 value,
        bool initialized,
        DeploymentMethod method
    );

    enum DeploymentMethod {
        DIRECT,
        CREATE2,
        LIBRARY
    }

    /**
     * @notice Deploy child with multiple constructor arguments (Issue #350)
     * @dev This is the most common failing scenario
     */
    function deployChildDirect(
        string memory _name,
        uint256 _initialValue,
        address _owner
    ) external returns (address) {
        ComplexChild child = new ComplexChild(_name, _initialValue, _owner);
        address childAddress = address(child);

        deployedChildren.push(child);
        isDeployed[childAddress] = true;

        emit ChildDeployed(
            childAddress,
            _name,
            _initialValue,
            true,
            DeploymentMethod.DIRECT
        );

        return childAddress;
    }

    /**
     * @notice Deploy child using CREATE2 for deterministic addresses (Issue #519)
     * @dev Tests verification with CREATE2 opcode
     */
    function deployChildCreate2(
        string memory _name,
        uint256 _initialValue,
        address _owner,
        bytes32 _salt
    ) external returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(ComplexChild).creationCode,
            abi.encode(_name, _initialValue, _owner)
        );

        address childAddress;
        assembly {
            childAddress := create2(0, add(bytecode, 0x20), mload(bytecode), _salt)
            if iszero(extcodesize(childAddress)) {
                revert(0, 0)
            }
        }

        ComplexChild child = ComplexChild(childAddress);
        deployedChildren.push(child);
        isDeployed[childAddress] = true;

        emit ChildDeployed(
            childAddress,
            _name,
            _initialValue,
            true,
            DeploymentMethod.CREATE2
        );

        return childAddress;
    }

    /**
     * @notice Deploy child using external library (Issue #519)
     * @dev Tests verification when deployment happens via library call
     */
    function deployChildViaLibrary(
        string memory _name,
        uint256 _initialValue,
        address _owner
    ) external returns (address) {
        address childAddress = DeploymentLibrary.deployChild(
            _name,
            _initialValue,
            _owner
        );

        ComplexChild child = ComplexChild(childAddress);
        deployedChildren.push(child);
        isDeployed[childAddress] = true;

        emit ChildDeployed(
            childAddress,
            _name,
            _initialValue,
            true,
            DeploymentMethod.LIBRARY
        );

        return childAddress;
    }

    function getDeployedChildrenCount() external view returns (uint256) {
        return deployedChildren.length;
    }

    function getDeployedChild(uint256 index) external view returns (address) {
        require(index < deployedChildren.length, "Index out of bounds");
        return address(deployedChildren[index]);
    }
}
