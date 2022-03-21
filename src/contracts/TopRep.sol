//// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;
import "./TopShelf.sol";
import "./TopToken.sol";
import "./TopDAO.sol";

// To discourage bad market behavior, allow sellers to burn tokens for reputation which DAO can slash for bad behavior
// Front ends and/or users can add trust by reputation
contract TopReputation { 

    mapping(address=>uint256) reputation;
    address admin;
    TopToken token;
    TopDAO DAO;
    
    constructor(TopToken _token, TopDAO _DAO){
        token = _token;
        admin = msg.sender;
        DAO = _DAO;
    }

    function addRep(uint256 _amount) external returns(bool){
        token.burnFrom(msg.sender, _amount);
        reputation[msg.sender] += _amount;
        return true;
    }

    function slashRep(address _account) external returns(bool){  // Slash = (DAOVotePercent - 50)/100 ie. 55% says slash, slash 5%
        require(msg.sender == address(DAO), "Only DAO");
        reputation[_account] -= (reputation[_account]/2);
        return true;
    }
}