const Web3 = require("web3/src");
const web3 = new Web3
// const { artifacts } = require("hardhat");
const Token = artifacts.require("TopToken");
const TopShelf = artifacts.require("TopShelf");
const TopStake = artifacts.require("TopStake");

module.exports = async function(deployer) {

	let [name, symbol] = ['TopShelf', 'TSM']
	await deployer.deploy(Token, 'TopShelfToken', 'TOPS', 18, 0)
	const token = await Token.deployed()	

	let [_listFee, _transferFee, _buyReward, _stakerReward, _defaultLeaseDuration, _renewalRatio, _foreclosureFee] = [web3.utils.toBN(1e16), String(0), String(1), String(1), String(10), String(1), web3.utils.toBN(1e18)]
	await deployer.deploy(TopShelf, name, symbol, token.address, _listFee, _transferFee, _foreclosureFee, _stakerReward, _buyReward, _defaultLeaseDuration, _renewalRatio)
    const topshelf = await TopShelf.deployed()  //assign topshelf contract into variable to get it's address
	
	await deployer.deploy(TopStake, 'TopShelfToken', 'TOPS', 18, 0)
	const token = await Token.deployed()	

	await token.mint(deployer, 1000e18);  // Give test account TOPs
	
    await token.passMinterRole(topshelf.address)  //change token's owner/minter from deployer to

};