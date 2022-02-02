//// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;
import "./TopToken.sol";
import "./TopShelf.sol";

/* 
Contract for staking tokens into listings for future rewards
*/

contract IsStakeable{
   struct Stake{ // A stake struct is used to represent the way we store stakes, A Stake will contain the users address, the amount staked and a timestamp, Since is when the stake was made
       address user;
       uint256 amount;
       uint256 since;
   }
   struct Stakeholder{  // Stakeholder is a staker that has active stakes
       address user;
       Stake[] address_stakes;
   }
   TopToken token;  // address of TOPS token
   Stakeholder[] public stakeholders; // This is a array where we store all Stakes that are performed on the Contract. The stakes for each address are stored at a certain index, the index can be found using the stakes mapping
   mapping(address => uint256) internal stakes; // Stakes is used to keep track of the INDEX for the stakers in the stakeholders array

   event Staked(address, uint256, uint256, uint256);
   function _addStakeholder(address staker) internal returns (uint256){
       stakeholders.push(); // Push a empty item to the Array to make space for our new stakeholder
       uint256 userIndex = stakeholders.length - 1; // Calculate the index of the last item in the array by Len-1
       stakeholders[userIndex].user = staker; // Assign the address to the new index
       stakes[staker] = userIndex; // Add index to the stakeHolders
       return userIndex;
   }
   function _stake(uint256 _amount) internal{  // _Stake is used to make a stake for an sender. It will remove the amount staked from the stakers account and place those tokens inside a stake container StakeID
       require(_amount > 0, "Cannot stake nothing"); // Simple check so that user does not stake 0
       uint256 index = stakes[msg.sender]; // Mappings in solidity creates all values, but empty, so we can just check the address
       uint256 timestamp = block.timestamp;
       if(index == 0){ // See if the staker already has a staked index or if its the first time
           // This stakeholder stakes for the first time
           // We need to add him to the stakeHolders and also map it into the Index of the stakes
           // The index returned will be the index of the stakeholder in the stakeholders array
           index = _addStakeholder(msg.sender);
       }
       stakeholders[index].address_stakes.push(Stake(msg.sender, _amount, timestamp));// Use the index to push a new Stake with the current block timestamp.
       emit Staked(msg.sender, _amount, index,timestamp);
   }
   function stake(uint256 _amount) public {  // Add functionality like burn to the _stake a function
       require(_amount < token._balances[msg.sender], "DevToken: Cannot stake more than you own");
       _stake(_amount);
       token._burn(msg.sender, _amount);
   }
    struct StakingSummary{  // contains all stakes performed by a certain account
        uint256 total_amount;
        Stake[] stakes;
    }
   function hasStake(address _staker) public view returns(StakingSummary memory){  // check if a account has stakes and the total amount along with all the seperate stakes
       uint256 totalStakeAmount; // totalStakeAmount is used to count total staked amount of the address
       // Keep a summary in memory since we need to calculate this
       StakingSummary memory summary = StakingSummary(0, stakeholders[stakes[_staker]].address_stakes);
       for (uint256 s = 0; s < summary.stakes.length; s += 1){ // Iterate all stakes and grab amount of stakes
          uint256 availableReward = calculateStakeReward(summary.stakes[s]);
          summary.stakes[s].claimable = availableReward;
          totalStakeAmount = totalStakeAmount+summary.stakes[s].amount;
      }
       summary.total_amount = totalStakeAmount; // Assign calculate amount to summary
       return summary;
   }
}

//    function mint(address _to, string memory _name, string memory _description, string memory _URI, uint256 _price, bool _paused,  uint256 _stock) external payable notNullAddress(_to) minListFee(){
//        uint256 tokenBalance = token.balanceOf(msg.sender);
//        if (tokenBalance>0){
//            token.burnFrom(msg.sender, token.balanceOf(msg.sender));  // Prevent buyers from using their tokens on their own listings
//        }
//        Item memory item;
//        listings.push(item);
//        uint256[] memory _vacantStakeSlots;  // Unstaked investors stay in stakers array which can be chosen for investor payouts, if new staker arrives, add them to old spot
//        Staker[] memory _stakers;// = Staker(address(0), 0);
// //        Staker memory stake;// = Staker(address(0), 0);
//        _stakers.push(_stake);
//        listings.push(Item(_name, _description, _URI, _paused, _price, _stock, defaultLeaseDuration, block.timestamp, 0, 0, _vacantStakeSlots, _stakers));  // uninitialized set to default?
//        itemOwner[totalSupply] = _to;  // starts at itemId 0 for item[] indexing
//        itemOperator[totalSupply] = _to;  // Overwrite item Operators
//        ownerItemCount[_to] += 1;  // Increase number that address owns
//        emit Transfer(address(0), _to, totalSupply);
//        totalSupply += 1;
//    }