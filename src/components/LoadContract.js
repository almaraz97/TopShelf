
export default async function LoadContract(web3, netId, account, TopToken, TopShelf) {
  const token = new web3.eth.Contract(TopToken.abi, TopToken.networks[netId].address);
  const tokenName = await token.methods.symbol().call();
  const topshelfAddress = TopShelf.networks[netId].address;
  const topshelf = new web3.eth.Contract(TopShelf.abi, topshelfAddress);
  const tokenBalance = await token.methods.balanceOf(account).call();
  const topshelfBalance = await web3.eth.getBalance(topshelfAddress); //topshelf.methods.etherBalanceOf(account).call()
  const totalListings = await topshelf.methods.totalSupply().call(); 
  const listfee = await topshelf.methods.listFee().call(); 
  const numStakes = await topshelf.methods.stakerItemCount(account).call(); 
  let foreclosureFee = await topshelf.methods.foreclosureFee().call();
  foreclosureFee = web3.utils.fromWei(foreclosureFee, 'ether');
  let stakerReward = 0;//await topshelf.methods.stakerReward().call();
  let buyReward = await topshelf.methods.buyReward().call();
  let defaultLeaseDuration = await topshelf.methods.defaultLeaseDuration().call();
  let renewalRatio = await topshelf.methods.renewalRatio().call();
  return [token, tokenName, topshelf, topshelfAddress, tokenBalance, topshelfBalance, totalListings, listfee, numStakes, foreclosureFee,
    stakerReward, buyReward, defaultLeaseDuration, renewalRatio]
}

export async function get_item_info(contract, index, web3){
  let item = await contract.methods.listings(index).call();
  let owner = await contract.methods.ownerOf(index).call();
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