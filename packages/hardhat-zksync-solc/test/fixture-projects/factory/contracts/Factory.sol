// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

contract Factory {
  address[] public ownContracts;

  function getContractCount() 
    public
    view
    returns(uint contractCount)
  {
    return ownContracts.length;
  }

  function newContract()
    public
    returns(address)
  {
    Dep c = new Dep();
    ownContracts.push(address(c));
    return address(c);
  }
}


contract Dep {
  function foo()
    public
    pure
    returns (string memory)
  {
    return "Boo";
  }    
}