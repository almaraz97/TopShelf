const Web3 = require("web3/src");
const web3 = new Web3
// const { artifacts } = require("hardhat");
const Token = artifacts.require("TopToken");
const TopShelf = artifacts.require("TopShelf");

module.exports = async function(deployer) {

	let [name, symbol] = ['TopShelf', 'TSM']
	await deployer.deploy(Token, 'TopShelfToken', 'TOPS', 18, 0)
	const token = await Token.deployed()	
	let [_listFee, _transferFee, _buyReward] = [web3.utils.toBN(1e16), String(0), String(1)]//1e16 [_listFee, _buyFee, _buyReward, _transferFee] = [String(1e13), String(1e12), String(1), String(1)]
	let [_stakerReward, _defaultLeaseDuration, _renewalRatio, _foreclosureFee] = [String(1), String(10), String(1), web3.utils.toBN(1e18)]//[String(5), String(1e18), String(1), String(5e18)]
    // await deployer.deploy(TopShelf, name, symbol, token.address, _listFee, _transferFee, _buyFee, _buyReward, _defaultLeaseDuration, _renewalFee, _renewalRatio, _foreclosureFee)
	await deployer.deploy(TopShelf, name, symbol, token.address, 
		_listFee, _transferFee, _foreclosureFee, _stakerReward, _buyReward, _defaultLeaseDuration, _renewalRatio)
	//assign topshelf contract into variable to get it's address
    const topshelf = await TopShelf.deployed()
	//change token's owner/minter from deployer to
    await token.passMinterRole(topshelf.address)
};