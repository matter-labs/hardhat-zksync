// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

contract FooDep {
  function foo()
    public
    pure
    returns (string memory)
  {
    return "Foo";
  }    
}