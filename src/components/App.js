import { Tabs, Tab } from 'react-bootstrap'
import TopShelf from '../abis/TopShelf.json'
import TopToken from '../abis/TopToken.json'
import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';
import MarketplaceCard from './MarketplaceCard';
import LoadContract from './LoadContract';
// import { textAlign } from '@mui/system';
// import Card from '@mui/material/Card';
// import Row from 'react-bootstrap/Row'
// import Col from 'react-bootstrap/Col'
// import CardActions from '@mui/material/CardActions';
// import CardContent from '@mui/material/CardContent';
// import CardMedia from '@mui/material/CardMedia';
// import Button from '@mui/material/Button';
// import Typography from '@mui/material/Typography';
import ReactDOM from 'react-dom';

class App extends Component {
  async componentDidMount() {
    await this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {

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

    App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');  // switch with user network
    if(typeof window.ethereum !== 'undefined'){
      const web3 = new Web3(window.ethereum);
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
      if (!window.ethereum.isConnected()){
        window.ethereum.request({ method: 'eth_requestAccounts' })
          // .then(handleAccountsChanged)
          .catch((error) => {
            if (error.code === 4001) {
              // EIP-1193 userRejectedRequest error
              console.log('Please connect to MetaMask.');
            } else {
              console.error(error);
            }
          });
      }

      window.ethereum.on('accountsChanged', function () {
        window.location.reload();  // Time to reload your interface with accounts[0]!
      });
      const netId = await web3.eth.net.getId()
      const account = window.ethereum.selectedAddress  // await web3.eth.getAccounts()
      if (typeof account!=='undefined'){  //check if account is detected, then load balance&setStates, else push alert
        const balance = await web3.eth.getBalance(account)
        this.setState({account: account, balance: balance, web3: web3})
      }else{
        window.alert('Please sign in with MetaMask')
      }
      // in try block, load contracts
      try {
        let [token, tokenName, topshelf, topshelfAddress, tokenBalance, topshelfBalance, totalListings, listfee, numStakes, foreclosureFee,
          stakerReward, buyReward, defaultLeaseDuration, renewalRatio] = await LoadContract(web3, netId, this.state.account, TopToken, TopShelf)
          console.log(numStakes)

        let [listingItems, listingsTotal, expiredItems, expiredTotal, stakeItems, stakedTotal] = await MarketplaceCard(web3, topshelf, this.state.account, totalListings, numStakes);

        document.getElementById('balance').innerText = String(web3.utils.fromWei(tokenBalance)) + ' TOPS';
        if(listingItems!== null){ReactDOM.render(listingItems, document.getElementById('openListings'))}
        if(expiredItems!== null){ReactDOM.render(expiredItems, document.getElementById('expiredListings'))}
        if(stakeItems!== null){ReactDOM.render(stakeItems, document.getElementById('stakedListings'))}

        this.setState({"token": token, "topshelf": topshelf, "topshelfAddress": topshelfAddress, "tokenBalance": web3.utils.fromWei(tokenBalance, 'ether'), "tokenName": tokenName,// "topshelfBalance": topshelfBalance,
                       "totalListings": listingsTotal, "totalExpiredItems": expiredTotal, "totalStakes": stakedTotal, 
                       "listfee": listfee, "stakerReward":stakerReward, "buyReward":buyReward, "defaultLeaseDuration":defaultLeaseDuration, "renewalRatio":renewalRatio,  "listfeeEth": Web3.utils.fromWei(String(listfee)),//stakerReward
                       })
      } catch (e){
        console.log('error', e)
        window.alert('Contracts not deployed to the current network')
      }
    } else{  //if MetaMask does not exist push alert
      window.alert('Please install MetaMask')
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      web3: 'undefined',
      account: '',
      token: null,
      topshelf: null,
      topshelfAddress: null,
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
          <button className='mr-2' id="account">{this.state.account.slice(0, 8)}..</button>
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
                      // get values
                      e.preventDefault()
                      let name = this.name.value
                      let description = this.description.value
                      let URI = this.URI.value
                      let price = this.price.value
                      price = Web3.utils.toWei(String(price)) //convert to wei
                      let stock = this.stock.value
                      this.state.topshelf.methods.mint(name, description, URI, price, false, stock).send({from:this.state.account, value:this.state.listfee}) //deposit(amount)
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
                  <br></br> {/* How many stakes the user has */}
                    You have {this.state.totalStakes} staked item(s)
                    <br></br>
                    <br></br>
                    {this.state.stakeItems}
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
                  <li>Pay ETH fee to list an item (NFT)</li>
                  <li>Buyers pay to purchase you items</li>
                  <li>Renew listings by burning TOPs</li>
                </ol><br></br>
                <u><h5>Buyers</h5></u>
                <ol>
                  <li>Purchase items with ETH</li>
                  <li>Get rewarded TOPs for purchases</li>
                  <li>Stake TOPs within listings for more TOPs</li>
                </ol>
                    <br></br>
                    Made by Almaraz.eth<br></br><br></br>
                  <div>
                    <button type='submit' className='btn btn-primary'>LinkedIn</button>
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

// Add modal, seconds till foreclosure, foreclosing, 

/*<form onSubmit={(e)=> {
                  let amount = web3.utils.toWei(this.stake.value.toString(), 'ether')
                  this.state.topshelf.methods.addItemStake(index, amount).send({from: this.state.account})
                }}>
                <div className='form-group mr-sm-2'>
                  <input
                    id='stake'
                    type='number'
                    step='0.01'
                    className="form-control form-control-md"
                    placeholder='Item price'
                    required
                    ref={(input) => {this.price = input}}
                  />
                <Button size="large">Invest</Button>
                </div>
              </form> */