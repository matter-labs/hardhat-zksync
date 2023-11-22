// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
import "./MathLib.sol";

contract TestCoin {

    using MathLib for uint;
    address owner = address(this);

    function multiplyExample(uint _a, uint _b) public view returns (uint, address) {
        return _a.multiply(_b);
    }
}