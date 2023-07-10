// SPDX-License-Identifier: MIT
pragma solidity ^0.4.26;

contract Lottery {
    
    address public manager;
    address[] public players;

    constructor() public {
        manager = msg.sender;
    }
    function bet() public payable {
        require(msg.value > 0.01 ether);
        players.push(msg.sender);
    }
    function selectWinner() public payable {
        require(players.length > 0 && msg.sender == manager);
        uint random = uint(keccak256(abi.encode(block.timestamp)));
        uint winner = random % players.length;
        players[winner].transfer(address(this).balance);
        delete players;
    }
    function getPlayers() public view returns (address[] memory){
        return players;
    }
}