const Web3 = require("web3/src");
const web3 = new Web3
// const { artifacts } = require("hardhat");
const Token = artifacts.require("TopToken");
const TopShelf = artifacts.require("TopShelf");

module.exports = async function(deployer) {
	console.log(deployer["networks"]['from']);

	let [name, symbol] = ['TopShelf', 'TSM']
	await deployer.deploy(Token, 'TopShelfToken', 'TOPS', 18, 0)
	const token = await Token.deployed()	
	await token.mint("0x18142Ad0aa7789634a7dA7431ca13b7Fb0d281c2", web3.utils.toBN("9000000000000000000000"));  // Give test account TOPs 1000e18

	let [_listFee, _transferFee, _buyReward, _stakerReward, _defaultLeaseDuration, _renewalRatio, _foreclosureFee] = [web3.utils.toBN(1e16), String(0), String(1), String(1), String(200), String(60), web3.utils.toBN(1e18)]
	await deployer.deploy(TopShelf, name, symbol, token.address, _listFee, _transferFee, _foreclosureFee, _stakerReward, _buyReward, _defaultLeaseDuration, _renewalRatio)
    const topshelf = await TopShelf.deployed()  // Assign topshelf contract into variable to get it's address
	
    await token.passMinterRole(topshelf.address)  // Change token's owner/minter from deployer to topshelf

};