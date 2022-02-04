import { tokens, ether, ETHER_ADDRESS, EVM_REVERT, wait } from './helpers'


const Token = artifacts.require('./Token')
const TopShelf = artifacts.require('./TopShelf')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('TopShelf', ([deployer, user]) => {
  let topshelf, token

  beforeEach(async () => {
    token = await Token.new()
    topshelf = await TopShelf.new(token.address) // Needs additional args
    await token.passMinterRole(topshelf.address, {from: deployer})
  })

  describe('testing token contract...', () => {
    describe('success', () => {
      it('checking token name', async () => {
        expect(await token.name()).to.be.eq('TopShelfToken')
      })

      it('checking token symbol', async () => {
        expect(await token.symbol()).to.be.eq('TOPS')
      })

      it('checking token initial total supply', async () => {
        expect(Number(await token.totalSupply())).to.eq(0)
      })

      // Mint tokens to contract and to addresses
      await token.mint(topshelf.address, 100e18)

      it('TopShelf should be given tokens', async () => {
        expect(await token.balanceOf(topshelf.address)).to.eq(100e18)
      })

      it('TopShelf should have Token minter role', async () => {
        expect(await token.minter()).to.eq(topshelf.address)
      })
    })

    describe('failure', () => {
      it('passing minter role should be rejected', async () => {
        await token.passMinterRole(user, {from: deployer}).should.be.rejectedWith(EVM_REVERT)
      })

      it('tokens minting should be rejected', async () => {
        await token.mint(user, '1', {from: deployer}).should.be.rejectedWith(EVM_REVERT) //unauthorized minter
      })
    })
  })

  describe('testing listings...', () => {
    let _listfee = await topshelf.methods.listfee().call()

    describe('success', () => {
      beforeEach(async () => {  // Seller mints item
        await topshelf.mint('Test', 'testing mint', 'https://google.com', 1e16, false, 100, {value: _listfee, from: user})
      })

      it('listings should increase', async () => { 
      })

      it('seller owns item', async () => { 
      })

      it('Seller paid ETH minting fee', async () => {
      })

      it('Item supply increased', async () => {
      })
    })

  })

  describe('testing purchases...', () => {
    let bBalance = web3.eth.getBalance(user)
    let sBalance = web3.eth.getBalance(user)

    describe('success', () => {

      it('purchase made', async () => {
        let item = await topshelf.methods.listings(0).call()
        let itemPrice = item[4]
        await topshelf.methods.buyItem().call({value: itemPrice, from: user})
        expect(Number(await topshelf.methods.listings(0).call()[5])).to.eq(99)
      })

      it('buyer paid item price', async () => {
        expect(Number(await web3.eth.getBalance(user))).to.be.below(Number(balance))
      })

      it('seller was paid', async () => {
      })

      it('buyer received token rewards', async () => {
        expect(Number(await web3.eth.getBalance(user))).to.be.above(Number(balance))
      })
      
      it('token supply increased', async () => {
      })
    })
  })

  describe('testing renewals...', () => {
  /* 
  Renewing 
  1. Item is delinquent
  2. Item is renewed
  */
  })

  describe('testing foreclosures...', () => {
    /* 
    Foreclosing
    1. Can't foreclose non-delinquent items
    2. Pay foreclosure token fee
    3. Item foreclosed
    4. Item foreclosed renovated
    */
  })

  describe('testing staking...', () => {
    /* 
    Staking
    1. STAKE TOKENS INTO ITEM
    2. EARN TOKEN YIELD FROM PURCHASES
    3. ADD ANOTHER STAKER
    4. EARN FRACTION OF YIELD
    5. GET KICKED OUT OF STAKING
    */
    })
})