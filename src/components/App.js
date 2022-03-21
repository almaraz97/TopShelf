import { Tabs, Tab } from 'react-bootstrap'
import TopShelf from '../abis/TopShelf.json'
import TopToken from '../abis/TopToken.json'
import React, { Component } from 'react';
import './App.css';
import MarketplaceCard from './MarketplaceCard';
import LoadContract from './LoadContract';
import ReactDOM from 'react-dom';
import { ethers } from "ethers";
import { textTransform } from '@mui/system';


// function startApp(provider) {
//   if (provider !== window.ethereum) {
//     console.error('Do you have multiple wallets installed?');
//   }
// }

// function handleChainChanged(_chainId) {
//   // window.location.reload();
// }
  //   function handleAccountsChanged(accounts) {
  //     console.log('Calling HandleChanged')
      
  //     if (accounts.length === 0) {
  //         console.log('Please connect to MetaMask.');
  //         $('#enableMetamask').html('Connect with Metamask')
  //     } else if (accounts[0] !== currentAccount) {
  //         currentAccount = accounts[0];
  //         $('#enableMetamask').html(currentAccount)
  //         $('#status').html('')
          
  //         if(currentAccount != null) {
  //             // Set the button label
  //             $('#enableMetamask').html(currentAccount)
  //         }
  //     }
  //     console.log('WalletAddress in HandleAccountChanged ='+walletAddress)
  // }
    //   let chainId = web3.ethereum.getId //////////////////// todo
    //   console.log(chainId)

      // try {  // Connect metamask, no metamask, reject metamask, wrong network (and switch)
      //   window.ethereum.request({ method: 'eth_requestAccounts' });
      // } catch (error) {
      //   console.error(error);
      // }
    
      // document.getElementById('connectButton').onClick = connect;
      // function connect() {
      //   console.log("Hello")
      //   window.ethereum
      //     .request({ method: 'eth_requestAccounts' })
      //     // .then(handleAccountsChanged)
      //     .catch((error) => {
      //       if (error.code === 4001) {
      //         // EIP-1193 userRejectedRequest error
      //         console.log('Please connect to MetaMask.');
      //       } else {
      //         console.error(error);
      //       }
      //     });
      // }
            // if (!window.ethereum.isConnected()){
      //   window.ethereum.request({ method: 'eth_requestAccounts' })
      //     // .then(handleAccountsChanged)
      //     .catch((error) => {
      //       if (error.code === 4001) {
      //         // EIP-1193 userRejectedRequest error
      //         console.log('Please connect to MetaMask.');
      //       } else {
      //         console.error(error);
      //       }
      //     });
      // }

      // window.ethereum.on('accountsChanged', function () {
      //   window.location.reload();  // Time to reload your interface with accounts[0]!
      // });

class App extends Component {

  async componentDidMount() {
    await this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {

    const provider = new ethers.providers.Web3Provider(window.ethereum, "any")
    await provider.send("eth_requestAccounts", []);
    provider.on("network", (newNetwork, oldNetwork) => {if (oldNetwork) {window.location.reload();}});  // Reload on network change
    const signer = provider.getSigner()
    let account = await signer.getAddress();
    
    let signedTopShelf = null;
    if(typeof provider !== 'undefined'){
      if (account!==null){  //check if account is detected, then load balance&setStates, else push alert
        // const mainnetProvider = new ethers.getDefaultProvider(await ethers.providers.getNetwork("homestead"));
        let name = null//await mainnetProvider.lookupAddress(account);
        if (name===null){name = account.slice(0, 8)+'..'};
        document.getElementById('account').innerText = name;

        let netId = (await provider.getNetwork()).chainId;
        console.log(account)
        if(netId === 1337){
          let [token, tokenName, topshelf, , tokenBalance, totalListings, listfee, numStakes, foreclosureFee,
          stakerReward, buyReward, defaultLeaseDuration, renewalRatio] = await LoadContract(ethers, signer, netId, account, TopToken, TopShelf)
          let signedTopShelf = topshelf.connect(signer)

          let [listingItems, listingsTotal, expiredItems, expiredTotal, stakeItems, stakedTotal] = await MarketplaceCard(ethers, topshelf, account, totalListings, numStakes);
          
          document.getElementById('balance').innerText = tokenBalance + ' TOPS';
          if(listingItems!== null){ReactDOM.render(listingItems, document.getElementById('openListings'))}
          if(expiredItems!== null){ReactDOM.render(expiredItems, document.getElementById('expiredListings'))}
          if(stakeItems!== null){ReactDOM.render(stakeItems, document.getElementById('stakedListings'))}

          this.setState({"account": account,
                          "token": token, "tokenName": tokenName, "topshelf": signedTopShelf, 
                          "totalListings": listingsTotal, "totalExpiredItems": expiredTotal, "totalStakes": stakedTotal, 
                          "listfee": listfee, "stakerReward":stakerReward, "buyReward": buyReward, "defaultLeaseDuration":defaultLeaseDuration, "renewalRatio":renewalRatio,  
                          "listfeeEth": listfee, //stakerReward
                          "tokenBalance": tokenBalance
                          })
        } else{
          // console.log('error', e)
          window.alert('Contracts not deployed to the current network')
        }
        // window.TopShelf = signedTopShelf;
      }else{
        window.alert('Please sign in with MetaMask')
      }
    } else{  //if MetaMask does not exist push alert
      window.alert('Please install MetaMask')
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      token: null,
      topshelf: null,
      balance: 0
    }
  }

  render() {
    return (
      <div className='text-monospace'>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            // href="#"
            target="_blank"
            rel="noopener noreferrer"
          >
          <img src={TopShelf} className="App-logo" alt="" height="32"/>
          <b>TopShelf</b>
        </a>
        <div>
          <button className='mr-2' id="account">Connect</button>
          <button className='mr-2' id="balance">Balance: 0</button>
        </div>
        </nav>
        <div className="container-fluid mt-5 text-center">
        <br></br>
          <h1>Top Shelf Curated Market</h1>
          <br></br>
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
              <Tabs defaultActiveKey="Listings" id="uncontrolled-tab-example" className="justify-content-center">
                <Tab eventKey="Listings" title="Listings">
                  <div>
                  <br></br>
                    {this.state.totalListings} Open Listings
                    <br></br><br></br>
                    <div id='openListings'></div>
                  </div>
                </Tab>
                <Tab eventKey="New" title="New">
                  <div>
                  <br></br>
                    Mint listing:
                    <br></br><br></br>
                    <form onSubmit={(e) => { 
                      e.preventDefault()
                      let name = this.name.value
                      let description = this.description.value
                      let URI = this.URI.value
                      let price = this.price.value
                      price = ethers.utils.parseEther(price, 'ether');
                      let stock = this.stock.value
                      let value = ethers.utils.parseEther(this.state.listfee).toString();
                      let tx = this.state.topshelf.functions.mint(name, description, URI, price, false, stock, 
                                                                  {from:this.state.account, value: value})
                      // console.log(tx, typeof tx) // TODO capture event emitted from listing item to give the seller feedback
                      // let rc = await tx;
                      // const event = rc.events.find(event => event.event === 'Transfer');
                      // const [from, to, val] = event.args;
                      // console.log(from, to, val);
                      // window.alert("Your listing has been created: Item ID " + String(val))
                      // window.location.reload()
                    }}>
                      <div className='form-group mr-sm-2'>
                        <input
                          id='name'
                          type='string'
                          className="form-control form-control-md"
                          placeholder='Item name'
                          required
                          ref={(input) => { this.name = input}}
                        />
                      </div>
                      <div className='form-group mr-sm-2'>
                        <input
                          id='description'
                          type='string'
                          className="form-control form-control-md"
                          placeholder='Item description'
                          required
                          ref={(input) => { this.description = input}}
                        />
                      </div>
                      <div className='form-group mr-sm-2'>
                        <input
                          id='URI'
                          type='string'
                          className="form-control form-control-md"
                          placeholder='Image URI'
                          required
                          ref={(input) => { this.URI = input}}
                        />
                      </div>
                      <div className='form-group mr-sm-2'>
                        <input
                          id='price'
                          type='number'
                          step='0.01'
                          min='0'
                          className="form-control form-control-md"
                          placeholder='Item price'
                          required
                          ref={(input) => {this.price = input}}
                        />
                      </div>
                      <div className='form-group mr-sm-2'>
                        <input
                          id='stock'
                          type='number'
                          step='1'
                          min='0'
                          className="form-control form-control-md"
                          placeholder='Item stock'
                          required
                          ref={(input) => {this.stock = input}}
                        />
                      </div>
                      <button type='submit' className='btn btn-primary'>MINT</button>
                    </form>
                  </div>
                </Tab>
                <Tab eventKey="Stakes" title="Stakes">
                  <br></br>
                    You have {this.state.totalStakes} staked item(s)
                    <br></br>
                    <br></br>
                    <div id='stakedListings'></div>
                </Tab>
                <Tab eventKey="Expired" title="Expired">
                  <div>
                  <br></br>
                    Expired listings: {this.state.totalExpiredItems}
                    <br></br><br></br>
                    <div id='expiredListings'></div>
                  </div>
                </Tab>
                <Tab eventKey="About" title="About">
                  <br></br>
                <u><h5>Sellers</h5></u>
                <ol>
                  <li>Pay ETH fee to list an item</li>
                  <li>Buyers pay to purchase your items</li>
                  <li>Buyers are minted an NFT (optional)</li>
                  <li>Renew listings by burning TOPs</li>
                </ol><br></br>
                <u><h5>Buyers</h5></u>
                <ol>
                  <li>Purchase items with ETH</li>
                  <li>Get rewarded TOPs for purchases</li>
                  <li>Get rewarded NFTs for use with other services</li>
                </ol><br></br>
                <u><h5>Stakers</h5></u>
                <ol>
                  <li>Stake TOPs into items you love</li>
                  <li>Get rewarded TOPs when others purchase the item</li>
                  <li>Get an NFT representing your stake to use elsewhere</li>
                </ol>
                    <br></br>
                    Made by Almaraz.eth<br></br><br></br>
                  <div>
                    <a href='https://www.linkedin.com/in/alejandro-almaraz-307a899b/' rel="noopener noreferrer" target="_blank" className='btn btn-primary'>LinkedIn</a>
                  </div>
                </Tab>
                <Tab eventKey="Settings" title="Settings">
                  <br></br>
                  List Fee: {this.state.listfeeEth} Eth<br></br>
                  Buy Reward: {this.state.buyReward} TOP per Eth<br></br>
                  Staker Reward: {this.state.stakerReward} TOP per Eth<br></br>
                  Default Lease Duration: {this.state.defaultLeaseDuration} Second(s)<br></br>
                  Renewal Ratio: {this.state.renewalRatio} Second(s) per Token
                </Tab>
              </Tabs>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;