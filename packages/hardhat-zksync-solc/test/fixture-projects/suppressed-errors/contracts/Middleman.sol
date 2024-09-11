// SPDX-License-Identifier: MIT

pragma solidity >=0.4.22 <0.9.0;

contract Middleman {

    function send(address payable to) public payable {
        to.transfer(msg.value / 2);
        to.send(msg.value / 2);
        payable(tx.origin).transfer(msg.value / 3);
    }

}
