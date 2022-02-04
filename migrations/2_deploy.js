const Token = artifacts.require("TopToken");
const TopShelf = artifacts.require("TopShelf");

module.exports = async function(deployer) {
    await deployer.deploy(Token, 'TopShelfToken', 'TOPS', 18, 0)
	const token = await Token.deployed()
	
	// pass token address
	let [name, symbol] = ['TopShelf', 'TSM']
	let [_mintFee, _buyFee, _buyReward, _transferFee] = [String(1e13), String(1e12), String(1), String(1)]
	let [_defaultLeaseDuration, _renewalFee, _renewalRatio, _foreclosureFee] = [String(5), String(1e18), String(1), String(5e18)]
	console.log(name, symbol, token.address, _mintFee, _transferFee, _buyFee, _buyReward, _defaultLeaseDuration, _renewalFee, _renewalRatio, _foreclosureFee)
    await deployer.deploy(TopShelf, name, symbol, token.address, _mintFee, _transferFee, _buyFee, _buyReward, _defaultLeaseDuration, _renewalFee, _renewalRatio, _foreclosureFee)
	//assign dBank contract into variable to get it's address
    const topshelf = await TopShelf.deployed()
	//change token's owner/minter from deployer to dBank
    await token.passMinterRole(topshelf.address)
};