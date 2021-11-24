// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

contract BarDep {
  function bar()
    public
    pure
    returns (string memory)
  {
    return "Bar";
  }    
}