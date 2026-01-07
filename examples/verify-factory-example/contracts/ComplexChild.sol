// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

/**
 * @title ComplexChild
 * @notice Child contract with complex constructor arguments
 * @dev Tests verification with multiple constructor parameters of different types
 */
contract ComplexChild {
    // Unique identifier to avoid matching other contracts
    string public constant VERSION = "ChildVerificationTest_v1.0_2024";
    uint256 public constant CONTRACT_ID = 0xC417D123456;

    struct Config {
        string name;
        uint256 value;
        address owner;
        uint256 createdAt;
        bool initialized;
    }

    Config public config;
    address public factory;
    uint256 public operationCount;

    mapping(address => uint256) public balances;

    event Initialized(string name, uint256 value, address owner);
    event ValueUpdated(uint256 oldValue, uint256 newValue);
    event OperationPerformed(address indexed caller, uint256 operationId);

    /**
     * @notice Constructor with multiple arguments (name, value, owner)
     * @dev This constructor pattern is what fails in issues #350, #362, #519
     */
    constructor(
        string memory _name,
        uint256 _initialValue,
        address _owner
    ) {
        require(_initialValue > 0, "Value must be greater than 0");
        require(_owner != address(0), "Owner cannot be zero address");
        require(bytes(_name).length > 0, "Name cannot be empty");

        config = Config({
            name: _name,
            value: _initialValue,
            owner: _owner,
            createdAt: block.timestamp,
            initialized: true
        });

        factory = msg.sender;
        operationCount = 0;

        emit Initialized(_name, _initialValue, _owner);
    }

    function getValue() external view returns (uint256) {
        return config.value;
    }

    function getName() external view returns (string memory) {
        return config.name;
    }

    function getOwner() external view returns (address) {
        return config.owner;
    }

    function setValue(uint256 _newValue) external {
        require(msg.sender == config.owner, "Only owner can set value");
        require(_newValue > 0, "Value must be greater than 0");

        uint256 oldValue = config.value;
        config.value = _newValue;

        emit ValueUpdated(oldValue, _newValue);
    }

    function performOperation() external returns (uint256) {
        operationCount++;
        balances[msg.sender] += 1;

        emit OperationPerformed(msg.sender, operationCount);

        return operationCount;
    }

    function getConfig() external view returns (
        string memory name,
        uint256 value,
        address owner,
        uint256 createdAt,
        bool initialized
    ) {
        return (
            config.name,
            config.value,
            config.owner,
            config.createdAt,
            config.initialized
        );
    }
}
