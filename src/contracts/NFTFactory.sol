//// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

// NFT contract generated on behalf of seller for their new listing
contract NFTFactory is ERC721Enumerable {
    address private admin;

    constructor(string memory _name, string memory _symbol, address toproute) ERC721(_name, _symbol){
        admin = toproute;
    }

    function mint(address _to) external{
        require(msg.sender == admin, "Only routing address can mint on sellers behalf");
        _mint(_to, totalSupply()+1);
    }
}