// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract BarDep {
  function bar() public pure returns (string memory) {
    return "Bar";
  }    
}
