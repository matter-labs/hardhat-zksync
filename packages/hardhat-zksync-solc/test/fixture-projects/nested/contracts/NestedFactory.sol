// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

// import Foo.sol and Bar.sol from nested directories
import "./deps/Foo.sol";
import "./deps/more_deps/Bar.sol";

contract NestedFactory {
    FooDep _foo;
    BarDep _bar;

    constructor() {
        _foo = new FooDep();
        _bar = new BarDep();
    }

    function foo() public view returns (string memory) {
        return _foo.foo();
    }

    
    function bar() public view returns (string memory) {
        return _bar.bar();
    }
}
