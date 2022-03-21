//// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;
import "./TopShelf.sol";
import "./TopToken.sol";
import "./NFTFactory.sol";


// TopShelf Market Routing contract allows
// Affiliate purchasing of TopShelf listings
// NFT contract generation for sellers to reward buyers
// Purchasing through affiliates
// Customers listing renewals
contract TopRouter {

    mapping(address => mapping(uint256 => NFTFactory)) public mintContract;  // Contract owned by listing owner that can mint upon purchasing of item
    TopShelf topshelf;
    TopToken token;
    address admin;

    event AffiliatePurchase(address affiliate, uint256 _itemId);
    event CustomerRenewal(address customer, uint256 _itemId, uint256 amount);

    constructor(TopShelf _topshelf, TopToken _token){
        topshelf = _topshelf;
        token = _token;
        admin = msg.sender;
    }

    function setMinter(uint256 _itemId, NFTFactory tokenContract) public {  // People can route purchases through their contracts
        // Function listers will set their minting contract
        mintContract[msg.sender][_itemId] = tokenContract;  // TODO public visibility may be vulnerable
    }

    function sellerNFTContractList(string memory name_, string memory symbol_, 
      string memory _name, string memory _description, string memory _URI, uint256 _price, bool _paused,  uint256 _stock) external payable returns(bool){
        // Create a TopShelf listing
        uint256 itemId = topshelf.mint(_name, _description, _URI, _price, _paused, _stock);//(topshelf.listFee);
        // Deploy an OpenZeppelin NFT contract for the seller
        NFTFactory _contract = new NFTFactory(name_, symbol_, address(this));
        // Set this new contract as the mint reward for purchases of this listing
        setMinter(itemId, _contract);
        return true;
    }


    function affiliateBuyMint(address lister, uint256 _itemId) external payable returns(bool){  // Function customers call
        // require(topshelf.ownerOf(_itemId)==lister, "Only listing owner can issue NFTs upon purchase");  // NOTE todo idea bug
        topshelf.buyItem(_itemId);  // NEED TO FORWARD PAYMENT HERE
        mintContract[lister][_itemId].mint(msg.sender);
        return true;
    }

    function customerItemRenewal(uint256 _itemId, uint256 _tokenAmount) external returns(bool){  // Function customers call
        // require(topshelf.ownerOf(_itemId)==lister, "Only listing owner can issue NFTs upon purchase");
        token.transferFrom(msg.sender, address(this), _tokenAmount); // @NOTE: Not ideal since customer transfer TOP to Router then router to renewal 
        topshelf.renewItem(_itemId, _tokenAmount);  // NEED TO FORWARD PAYMENT HERE
        emit CustomerRenewal(msg.sender, _itemId, _tokenAmount);
        return true;
    }
}
