//// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;
import "./TopToken.sol";
import "./TopStake.sol";


contract TopShelf {
    struct Item {
        string name;
        string description;
        string URI;
        bool paused;
        uint256 price;
        uint256 stock;
        uint256 leaseDuration;  // Seconds before needing to renew
        uint256 dateCreated;
        uint256 timesPurchased;
    }

    address private deployer;
    string public name;
    string public symbol;
    uint256 public totalSupply;
    uint256 public listFee;  // ETH paid to contract for minting items
    uint256 public transferFee;  // ETH paid to contract for transferring items to another address
    uint256 public foreclosureFee;  // Tokens paid to take ownership away from delinquent seller
    uint256 public buyReward;  // Tokens paid to contract to foreclose delinquent items
    uint256 public defaultLeaseDuration;  // Lease period in seconds for newly minted items
    uint256 public renewalRatio;  // Number of seconds per token given to items' lease duration (bonus for number of stakers?)
    uint256 public stakerReward;  // Tokens paid to item stakers per user buying item
    uint256 public stakeLeaseReward;  // Adding of stake to item adds lease duration by n seconds (DEFAULT IS 1)
    uint256 public unstakePenalty;  // Removal of stake from item lowers lease duration by 1/(2**n)
    mapping(uint256=>address) public itemOwner;  // itemId to owner address
    mapping(uint256=>address) public itemOperator;  // itemId to approved operator's address
    mapping(address=>address) public ownerOperator;  // Operator for all items owned by this address
    mapping(address=>uint256) public ownerItemCount;  // Owner address to number of items held
    mapping(address=>uint256) public stakerItemCount;
    TopToken token;  // address of TOPS token
    TopStake topstake;  // address of TOPS staking
    Item[] public listings;

    modifier onlyDeployer(){require(msg.sender == deployer, "Only deployer"); _;}
    modifier onlyOwnerOf(uint256 _itemId){require(msg.sender == itemOwner[_itemId], "Only Item Owner"); _;}  // add approved operators
    modifier notOwnerOf(uint256 _itemId){require(msg.sender != itemOwner[_itemId], "Only not owners of this Item"); _;}  // add approved operators
    modifier onlyBuyers(){require(ownerItemCount[msg.sender] == 0, "Only non-item owning accounts"); _;}  // Prevent B2B purchases..  // todo preventing buyers somehow??
    modifier onlyOperatorsOf(uint256 _itemId){require((msg.sender == itemOperator[_itemId]) || (msg.sender == ownerOperator[itemOwner[_itemId]]), "Only operators of"); _;}  // add approved operators
    modifier itemExists(uint256 _itemId){require(itemOwner[_itemId] != address(0), "Item must exist"); _;}  //modifier isDelinquent(uint256 _itemId){Item memory item = listings[_itemId]; require(item.dateCreated+item.leaseDuration<=block.timestamp, "Item is not delinquent"); _;} // Use storage here?
    modifier notNullAddress(address _to){require(_to != address(0), "Mint to the zero address"); _;}
    // EVENTS
    event TestSender(address indexed _sender);
    event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);  // todo
    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);  // todo
    event Transfer(address indexed _from, address indexed _to, uint256 indexed _itemId);  // todo allow transfers?
    event ItemPurchased(address indexed _buyer, uint256 indexed _itemId);
    event RenewedItem(uint256 indexed _itemId);
    event SelfForeclosedItem(uint256 indexed _itemId);
    event ItemForeclosed(uint256 indexed _itemId);
    event PausedItem(uint256 indexed _itemId);  // event ItemPurchasedToken(address indexed _buyer, uint256 indexed _itemId);

    // CONSTRUCTOR
    constructor(string memory _name, string memory _symbol, TopToken _token, uint256 _listFee, uint256 _transferFee,
        uint256 _foreclosureFee,  uint256 _stakerReward, uint256 _buyReward, uint256 _defaultLeaseDuration,
        uint256 _renewalRatio) { //uint256 _unstakePenalty,
        name = _name;
        symbol = _symbol;
        deployer = msg.sender;
        token = _token;
        listFee = _listFee;  // WEI ~10 dollars (higher = more good items but less overall)
        transferFee = _transferFee;
        foreclosureFee = _foreclosureFee;  // 10 tokens (set higher to slow down foreclosures, depends on inflation)
        stakerReward = _stakerReward;
        buyReward = _buyReward;  // Tokens rewarded to buyers
        defaultLeaseDuration = _defaultLeaseDuration;  // 604800 is 7 days
        renewalRatio = _renewalRatio;  // 1 token = 1 day  (Set higher for favoring consumers over producers)
    }
    // SETTERS
    function setTokenAddress(address _address) external onlyDeployer(){token = TopToken(_address);}
    function setStakingAddress(address _address) external onlyDeployer(){topstake = TopStake(_address);}
    function setTransferFee(uint256 _amount) external onlyDeployer(){transferFee = _amount;}
    function setListFee(uint256 _amount) external onlyDeployer(){listFee = _amount;}
    function setDefaultLeaseDuration(uint256 _seconds) external onlyDeployer(){defaultLeaseDuration = _seconds;}
    function setRenewalRatio(uint256 _tokenSeconds) external onlyDeployer(){renewalRatio = _tokenSeconds;}
    function setForeclosureFee(uint256 _amount) external onlyDeployer(){foreclosureFee = _amount;}
    function setBuyReward(uint256 _amount) external onlyDeployer(){buyReward = _amount;}
    // READ VARIABLES
    function balanceOf(address _owner) public view notNullAddress(_owner) returns (uint256) {return ownerItemCount[_owner];}
    function ownerOf(uint256 _itemId) public view itemExists(_itemId) returns (address) {return itemOwner[_itemId];}
    function itemExpiryDate(uint256 _itemId) public view returns(uint256){Item memory item = listings[_itemId]; return item.dateCreated+item.leaseDuration;} // item.dateCreated+item.leaseDuration-block.timestamp;}
    function itemDelinquent(uint256 _itemId) public view returns(bool){Item memory item = listings[_itemId]; return (item.dateCreated+item.leaseDuration)<=block.timestamp;}
    function getOwnerItems(address owner) external view returns(uint[] memory){
        uint[] memory result = new uint[](ownerItemCount[owner]);
        uint counter = 0;
        for(uint16 i=0; i<listings.length; i++){
            if (ownerOf(i)==owner){
                result[counter] = i;
                counter++;
            }
        }
        return result;
    }
    function getBalance() public view returns (uint) {return address(this).balance;}
    function withdraw(uint256 _amount) public onlyDeployer() returns(bool){require(_amount<=address(this).balance); return payable(msg.sender).send(_amount) ;}

    // FUNCTIONS
    function mint(string memory _name, string memory _description, string memory _URI, uint256 _price, bool _paused,  uint256 _stock) external payable{ // notNullAddress(_to)
        require(msg.value >= listFee, "Must pay mint fee");
        address _to = msg.sender;
        listings.push();  //Item memory item = Item(_name, _description, _URI, _paused, _price, _stock, defaultLeaseDuration, block.timestamp, 0, 0);  // uninitialized set to default? //listings[itemId] = Item(_name, _description, _URI, _paused, _price, _stock, defaultLeaseDuration, block.timestamp, 0, 0);
        uint256 itemId = listings.length - 1;
        Item storage item = listings[itemId];
        item.name = _name;
        item.description = _description;
        item.URI = _URI;
        item.stock = _stock;
        item.paused = _paused;
        item.price = _price;  // Ether cost in WEI
        item.dateCreated = block.timestamp;
        item.leaseDuration = defaultLeaseDuration;
        itemOwner[totalSupply] = _to;  // starts at itemId 0 for item[] indexing
        itemOperator[totalSupply] = _to;  // Overwrite item Operators
        ownerItemCount[_to] += 1;  // Increase number that address owns
        emit Transfer(address(0), _to, totalSupply);
        totalSupply += 1;
    }
    function buyItem(uint256 _itemId) external payable itemExists(_itemId) returns(bool){ // onlyBuyers()*
        require(ownerItemCount[msg.sender] == 0, "Only buying accounts");
        Item storage item = listings[_itemId];
        require(!item.paused, "Item is not purchasable");
        require(msg.value >= item.price, "Must pay item price");
        require(!itemDelinquent(_itemId), "Item expired");
        require(item.stock > 0, "Out of stock");

        address payable seller = payable(ownerOf(_itemId));  // Forward buyer payment to seller
        (bool sent, ) = seller.call{value: msg.value}("");   // todo return excess payment?
        require(sent, "Failed to send Ether");
        
        item.stock -= 1;
        item.timesPurchased += 1;

        uint256 reward = (buyReward * msg.value);
        require(topstake.rewardStakers(_itemId, stakerReward, reward), "Must reward stakers");
        topstake.mint(msg.sender, reward);  // Reward buyer

        emit ItemPurchased(msg.sender, _itemId);
        return true;
    } // 160_639 gas 
    function renewItem(uint256 _itemId, uint256 _tokenAmount) onlyOwnerOf(_itemId) public {  // TEST BURNING
        token.burnFrom(msg.sender, _tokenAmount);  // todo will this throw if msg.sender doesn't have tokens?
        listings[_itemId].leaseDuration += (_tokenAmount*renewalRatio)/1e18;  // _tokenAmount in WEI, remove decimals for units
    }
    function forecloseItem(uint256 _itemId) public returns(bool){
        Item memory item = listings[_itemId]; 
        require(item.dateCreated+item.leaseDuration<=block.timestamp, "Item is not delinquent");
        token.transferFrom(msg.sender, address(this), foreclosureFee);  // User pays foreclosure fee in tokens
        address owner = itemOwner[_itemId];
        _transfer(owner, msg.sender, _itemId);
        listings[_itemId].leaseDuration += (1*renewalRatio);
        return true;
    }
    function forecloseRenovate(uint256 _itemId, string memory _name, uint256 _price, string memory _description) public returns(bool){
        bool success = forecloseItem(_itemId);
        if (success){
            Item storage item = listings[_itemId];
            item.name = _name;
            item.price = _price;
            item.description = _description;
            item.timesPurchased = 0;
            item.leaseDuration = defaultLeaseDuration;
            item.dateCreated = block.timestamp;
        }
        return success;
    }

    // ITEM SETTERS
    function changeItemPrice(uint256 _itemId, uint256 _price) external onlyOwnerOf(_itemId) returns(bool){
        Item storage item = listings[_itemId];
        item.price = _price;
        return true;
    }
    function pausePlayItem(uint256 _itemId, bool _state) external onlyOwnerOf(_itemId) returns(bool){
        Item storage item = listings[_itemId];
        item.paused = _state;
        return true;
    }
    function selfForecloseItem(uint256 _itemId) external onlyOwnerOf(_itemId) returns(bool){
        Item storage item = listings[_itemId];
        uint256 difference = block.timestamp - item.dateCreated;
        require(difference>=0);
        item.leaseDuration = difference;
        item.paused = true;
        return true;
    }
    function _transfer(address _from, address _to, uint256 _itemId) private notNullAddress(_to) {
        ownerItemCount[_from] -= 1;
        itemOwner[_itemId] = _to;
        itemOperator[_itemId] = _to;  // Overwrite item Operators
        ownerItemCount[_to] += 1;
        emit Transfer(_from, _to, _itemId);
    }
    function transfer(address _to, uint256 _itemId) external onlyOwnerOf(_itemId) {
        require(false, "Error: Transferring listings is not supported. Use forecloseItem to delete listing.");
        token.transfer(address(this), transferFee);  // May cause userOperator to pay instead of user
        _transfer(msg.sender, _to, _itemId);
    }
}