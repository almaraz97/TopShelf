//// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;
import "./TopShelf.sol";
import "./TopToken.sol";

contract TopDAO {
    TopShelf topshelf;
    TopToken token;
    address admin;

    constructor(TopToken _token, TopShelf _topshelf){
        topshelf = _topshelf;
        token = _token;
        admin = msg.sender;
    }

    function burnTOPs(uint256 _amount){  // Allow the DAO to burn its TOPs balance
        token.burn(msg.sender, _amount);
    }
    function transferTOPs(address _to, uint256 _amount){  // Allow the DAO to fund upstarts
        token.transfer(_to, _amount);
    }
    
}