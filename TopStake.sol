//// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;
import "./TopToken.sol";
import "./TopShelf.sol";

contract TopStake{

    address private deployer;  // uint256 totalStaked;
    TopShelf public topshelf;  // Admin
    TopToken public token;

    struct Stake{
        address Address;
        uint256 Amount;
    }
    mapping(uint256 => mapping(uint256 => Stake)) public itemStake;   
    mapping(uint256 => mapping(address => uint256)) public itemStakerId;  // itemId to address to stakeIndex (user's stakeId for their item investment) [This is used as the storage limiter for ISAs, everything after is not considered]
    mapping(uint256 => uint256) public itemTotalStakers;  // itemId to number of staker
    mapping(uint256 => uint256) public itemTotalStake;  // itemId to number of stakes 

    mapping(address => uint256) public stakerTotalStaked;  // ItemId to stakerAddress to stakeAmount (amount of investment user made)
    mapping(address => uint256) public stakerTotalStakes;  // Address to itemId to stakeIndex (number of investments user has)

    constructor (address _deployer, TopToken _token, TopShelf _topshelf){
        deployer = _deployer;
        token = _token;
        topshelf = _topshelf;
    }
    // modifier onlyDeployer(){require(msg.sender == deployer, "Only deployer"); _;}
    modifier onlyShelf(){require(msg.sender == address(topshelf), "Only topshelf"); _;}
    event StakeAdded(address indexed _staker, uint256 indexed _itemId, uint256 indexed _amount);
    event StakeRemoved(address indexed _staker, uint256 indexed _itemId, uint256 indexed _amount);

    function addItemStake(uint256 _itemId, uint256 _amount) external returns(bool){  /*onlyBuyers(msg.sender)*/ 
        require(topshelf.ownerOf(_itemId) != address(0));
        require(_amount>0, 'Must stake tokens');

        token.burnFrom(msg.sender, _amount);
        uint256 stakeId = itemStakerId[_itemId][msg.sender];  // Find their stakeId for an item
        if (stakeId != 0){  // They've already staked
            itemStake[_itemId][stakeId].Amount += _amount;
        } else{  // New staker
            stakerTotalStakes[msg.sender] +=1;
            itemTotalStakers[_itemId] += 1;  // Another unique staker is added
            stakeId = itemTotalStakers[_itemId];  // DOES THIS UPDATE STORAGE??
            itemStake[_itemId][stakeId].Address = msg.sender;
        }
        stakerTotalStaked[msg.sender] += _amount;
        itemTotalStake[_itemId] += _amount;   // leaseDuration += _amount;  // (_amount*renewalRatio);

        emit StakeAdded(msg.sender, _itemId, _amount);
        return true;
    }

    function removeItemStake(uint256 _itemId, uint256 _amount) external returns(bool){ // if remove all stake just move last user to vacant spot
        uint256 stakeId = itemStakerId[_itemId][msg.sender];
        require(stakeId !=0, "Must stake before unstaking");
        
        uint256 userStake = itemStake[_itemId][stakeId].Amount;
        require(userStake >= _amount, "Cannot unstake more than is staked");
        userStake -= _amount;  // does this change storage?  // leaseDuration -= _amount; //1 >> _amount;  // Un-stake penalty is half of stake leaseDuration reward (exploitable)
        
        stakerTotalStaked[msg.sender] -= _amount;
        itemTotalStake[_itemId] -= _amount;
        uint256 thisItemTotalStakers = itemTotalStakers[_itemId];
        
        if (userStake == 0){  // User is removing all of item stake
            stakerTotalStakes[msg.sender] -= 1;
            if (stakeId == thisItemTotalStakers){  // Exiting staker is also last staker, just disregard them and after
                itemStakerId[_itemId][msg.sender] = 0;
            } else{  // Exiting staker leaves hole, fill it with last staker's info
                address lastStaker = itemStake[_itemId][thisItemTotalStakers].Address;
                itemStake[_itemId][stakeId].Address = lastStaker;
                itemStake[_itemId][stakeId].Amount = itemStake[_itemId][thisItemTotalStakers].Amount;
                itemStakerId[_itemId][lastStaker] = stakeId;
            }
            thisItemTotalStakers -= 1;  // Every stake after this index is disregarded
        }
        token.mint(msg.sender, _amount);
        emit StakeRemoved(msg.sender, _itemId, _amount);
        return true;
    }

    function rewardStakers(uint256 _itemId, uint256 _stakerReward, uint256 _reward) external onlyShelf() returns(bool){ // private?  // https://en.wikipedia.org/wiki/Modulo_operation#Performance_issues + https://medium.com/coinmonks/math-in-solidity-part-5-exponent-and-logarithm-9aef8515136e#ebd5
        uint256 totalStakers = itemTotalStakers[_itemId];
        if (totalStakers > 1){  // uint256 randomInt = 1;  // _item.itemStakeAddresses.length%((block.timestamp%10)+1);  // uint256 randomInt = (block.timestamp & ((1 << _item.itemStakeAddresses.length)-1))+1;  // TODO random int from oracle (0->n]
            uint256 randomInt = uint(blockhash(block.number - 1)) % totalStakers; //itemStakeAddresses[_itemId].length;
            Stake storage randStake = itemStake[_itemId][randomInt];
            address stakerAddress = randStake.Address;
            uint256 stakerAmount = randStake.Amount;

            uint256 reward = (_stakerReward *_reward) * (stakerAmount/itemTotalStake[_itemId]);  // Reward proportional to other stakers and price of the item
            token.mint(stakerAddress, reward);  // Reward curator in token
        }
        return true;
    }

    function mint(address account, uint256 amount) public onlyShelf(){
        token.mint(account, amount);
    }
}

    // struct Stake{
    //     address[] itemStakeAddresses;  // ItemId to stakers
    //     uint256[] itemStakeAddresses;  // ItemId to stakes (Must be synced with itemStakeAddresses)
    //     uint256[] vacantStakeSlots;  // Unstaked investors stay in stakers array which can be chosen for investor payouts, if new staker arrives, add them to old spot
    // }

    // itemTotalStakers[_itemId] -= 1;

    // vacantStakeSlots[_itemId].push(stakeId);  // todo reentrancy vulnerability?
    // itemStakerId[_itemId][msg.sender] = 0;
    // stakerTotalStakes[msg.sender] -= 1;


// ADD STAKE FUNCTION
    // if (vacantStakeSlots[_itemId].length>1){  // There are empty slots, assign them to an old one
    //     uint256 _vacantStakeSlot = vacantStakeSlots[_itemId][0];
    //     delete vacantStakeSlots[0];
    //     itemStakerId[_itemId][msg.sender] = _vacantStakeSlot;  // leaseDuration += _amount;  // (_amount*renewalRatio);
    //     itemStakeAddresses[_itemId][_vacantStakeSlot] = msg.sender;
    //     itemStakeAmounts[_itemId][_vacantStakeSlot] = _amount;
    // } else{  // No empty slots, push new slot
    //     itemStakerId[_itemId][msg.sender] = itemStakeAddresses[_itemId].length;  // Assign user a stakeId
    //     itemStakeAddresses[_itemId].push(msg.sender);
    //     itemStakeAmounts[_itemId].push(_amount);  // leaseDuration += _amount;  // (_amount*renewalRatio);
    // }