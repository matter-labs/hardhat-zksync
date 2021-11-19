// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

// import Foo.sol and Bar.sol from nested directories
import "./libraries/Foo.sol";
import "./libraries/more_libraries/Bar.sol";

contract Import {
    function getFooName() public pure returns (string memory) {
        return Foo.name;
    }
    
    function getBarName() public pure returns (string memory) {
        return Bar.name;
    }
}
