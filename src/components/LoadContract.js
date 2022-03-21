

export default async function LoadContract(ethers, signer, netId, account, TopToken, TopShelf) {
  const token = new ethers.Contract(TopToken.networks[netId].address, TopToken.abi, signer);
  const tokenName = (await token.functions.symbol())[0];
  let tokenBalance = (await token.functions.balanceOf(account)).toString();
  tokenBalance = ethers.utils.formatUnits(tokenBalance, 18).toString();

  const topshelf = new ethers.Contract(TopShelf.networks[netId].address, TopShelf.abi, signer);
  const totalListings = (await topshelf.functions.totalSupply()).toString(); 
  let listfee = (await topshelf.functions.listFee()).toString(); 
  listfee = ethers.utils.formatUnits(listfee, 18).toString();
  let buyReward = (await topshelf.functions.buyReward()).toString();

  let defaultLeaseDuration = (await topshelf.functions.defaultLeaseDuration()).toString();
  let renewalRatio = (await topshelf.functions.renewalRatio()).toString();

  let foreclosureFee = (await topshelf.functions.foreclosureFee()).toString();
  foreclosureFee = ethers.utils.formatUnits(foreclosureFee, 18).toString();

  let stakerReward = (await topshelf.functions.stakerReward()).toString();
  // stakerReward = ethers.utils.formatUnits(stakerReward, 18).toString();
  const numStakes = (await topshelf.functions.stakerTotalStakes(account)).toString(); 

  return [token, tokenName, topshelf, 'topshelfAddress', tokenBalance, totalListings, listfee, numStakes, foreclosureFee,
    stakerReward, buyReward, defaultLeaseDuration, renewalRatio]
}

export async function get_item_info(contract, index, web3){
  let item = await contract.methods.listings(index);
  let owner = await contract.methods.ownerOf(index);
  let _name = await item.name;
  let description = await item.description;
  let URI = await item.URI;
  let price = await item.price;
  let stock = await item.stock;
  let timesPurchased = await item.timesPurchased;
  let leaseDuration = await item.leaseDuration;
  let dateCreated = await item.dateCreated;
  let expiry = Math.round((((parseInt(dateCreated)+parseInt(leaseDuration))*1000) - Date.now())/60000); //;
  dateCreated = new Date(dateCreated*1000);
  dateCreated = dateCreated.getUTCDate() + '/' + (dateCreated.getUTCMonth() + 1)+ '/' + dateCreated.getUTCFullYear();
  return [_name, description, URI, web3.utils.fromWei(price), stock, timesPurchased, owner, expiry, dateCreated]
}

export async function withdraw(e) {
  // Prevent button from default click
  e.preventDefault()
  // Check if this.state.TopShelf is ok
  if(this.state.topshelf !=='undefined'){
    try{  //in try block call TopShelf withdraw();
      await this.state.topshelf.methods.withdraw().send({from: this.state.account})
    } catch(e) {
      console.log('Error, withdraw: ', e)
    }
  }
}