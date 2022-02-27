import { Tabs, Tab } from 'react-bootstrap'
import TopShelf from '../abis/TopShelf.json'
import TopToken from '../abis/TopToken.json'
import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';
import MarketplaceCard from './MarketplaceCard';
import LoadContract from './LoadContract';
// import { textAlign } from '@mui/system';
import Card from '@mui/material/Card';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
// import React from 'react';

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
    
      if (!window.ethereum.isConnected()){
        window.ethereum
          .request({ method: 'eth_requestAccounts' })
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
      // .addEventListener('click', () => {
      //   //Will Start the metamask extension
      //   ethereum.request({ method: 'eth_requestAccounts' });
      // });
      // window.ethereum.on('accountsChanged', function (accounts) {
      //   location.refresh()  // Time to reload your interface with accounts[0]!
      // });
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
        let [listings, expired] = [[], []]
        for (let i=0 ; i<totalListings; i++) {
          let item = await topshelf.methods.listings(i).call();  // find if delinquent client side
          let expiresIn = (parseInt(item[6])+parseInt(item[7]))*1000 - Date.now();
          if (expiresIn>0) {  //!delinquent  // let delinquent = await topshelf.methods.itemDelinquent(i).call();
            listings.push(item);
          } else{
            expired.push(item);
          }
        }
        let listingItems = null;
        if (listings.length!==0){
          listingItems = listings.map((item, index) =>
          <Col key={index}>
              <Card style={{minHeight: 500, maxHeight:500, maxWidth: 300, minWidth: 300}} className='my-1'>
              <CardMedia  
                sx={{ maxWidth: 200, maxHeight: 200, minWidth: 200, minHeight: 200 }}
                component="img"
                image={item[2]}
                alt={item[2]}
              />
              <CardContent sx={{ maxHeight: 200, minHeight: 200 }}>
                <Typography gutterBottom variant="h5" component="div">
                {item[0]}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item[1]}<br></br>
                  Price: {web3.utils.fromWei(item[4], "ether")}<br></br>
                  Lease Duration: {item[6]}<br></br>
                  Date Created: {item[7]}<br></br>
                  Expires in: {Math.round((((parseInt(item[6])+parseInt(item[7]))*1000) - Date.now())/60000)} seconds
                </Typography>
              </CardContent>
              <CardActions className='border-top row'>  {/*sx={{ maxHeight: 150, minHeight: 150 }}*/}
                <Button className='col-12' size="large" onClick={(e)=> {
                  let itemPrice = item[4]
                  this.state.topshelf.methods.buyItem(index).send({from:this.state.account, value:itemPrice})
                }}>Purchase</Button>
                {/* <form className='col-12' style={{float: 'inline'}} onSubmit={(e)=> {
                    let amount = web3.utils.toWei(this.stake.value.toString(), 'ether')
                    this.state.topshelf.methods.addItemStake(index, amount).send({from: this.state.account})
                  }}>
                  <div className='form-group row'>
                    <input
                      id='stake'
                      type='number'
                      step='0.01'
                      className="col-8 ml-3"
                      placeholder='Amount'
                      required
                      ref={(input) => {this.stake = input}}
                    />
                    <Button className='col-2 ml-2' type='submit' size="large">Invest</Button>
                  </div>
                </form> */}
                {/* <div>
                    <input
                      id={'stake' + index}
                      type='number'
                      min='0.01'
                      step='0.01'
                      className="col-8 ml-3"
                      placeholder='Amount'
                      required
                      // ref={(input) => {this.stake = input}}
                    />
                    <Button className='col-2 ml-2' size="large" onClick={(e)=> {
                      let amount = web3.utils.toWei(document.getElementById('stake'+index).value.toString(), 'ether')
                      this.state.topshelf.methods.addItemStake(index, amount).send({from: this.state.account})
                    }}>Invest</Button>
                  </div> */}
              </CardActions>
            </Card>
          </Col>
          );
          listingItems = <Row xs={4} md={4} className="g-4">{listingItems}</Row>
        } 
        let expiredItems = null;
        console.log(expired.length!==0)
        if (expired.length!==0){
          expiredItems = expired.map((item, index) =>
          <Col key={index}>
              <Card style={{minHeight: 500, maxHeight:500, maxWidth: 300, minWidth: 300}} className='my-1'>
              <CardMedia  
                sx={{ maxWidth: 200, maxHeight: 200, minWidth: 200, minHeight: 200 }}
                component="img"
                image={item[2]}
                alt={item[2]}
              />
              <CardContent sx={{ maxHeight: 225, minHeight: 225 }}>
                <Typography gutterBottom variant="h5" component="div">
                {item[0]}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item[1]}<br></br>
                  Price: {web3.utils.fromWei(item[4].toString(), "ether")}
                </Typography>
              </CardContent>
              <CardActions className='border-top row my-1'>  {/*sx={{ maxHeight: 150, minHeight: 150 }}*/}
                <div>
                    <input
                      id={'stake' + index}
                      type='number'
                      min='0.01'
                      step='0.01'
                      className="col-8 ml-1"
                      placeholder='Amount'
                      required
                    />
                    <Button className='col-2 ml-2' size="large" onClick={(e)=> {
                      let amount = web3.utils.toWei(document.getElementById('stake'+index).value.toString(), 'ether')
                      this.state.topshelf.methods.renewItem(index, amount).send({from: this.state.account})
                    }}>Renew</Button>
                  </div>
              </CardActions>
            </Card>
          </Col>
          );
          // console.log(expired.length, expiredItems)
          expiredItems = <Row xs={4} md={4} className="g-4">{expiredItems}</Row>
        }
        let stakes = []
        let i=0;
        while (stakes.length<numStakes){ // Go through item index until all item stakes are retrieved
          let stakeId = await topshelf.methods.getstakerItemStakeId(this.state.account, i).call(); //await
          if (stakeId!==0){
            let stakeAmount = await topshelf.methods.getItemStakeIdStake(i, stakeId).call(); //await
            stakes.push({'index': i, 'item': listings[i], 'stakeAmount': stakeAmount});
          }
          i+=1;
        }
        let stakeItems = null;
        if (stakes.length!==0){
          stakeItems = stakes.map((itemStakeDict, index) =>
          <Col key={index}>
              <Card sx={{ maxWidth: 345, minWidth: 345 }}>
              <CardMedia  
                sx={{ maxWidth: 345, maxHeight: 345 }}
                component="img"
                image={itemStakeDict['item'][2]}
                alt={itemStakeDict['item'][2]}
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                {itemStakeDict['item'][0]}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {itemStakeDict['item'][1]}<br></br>
                  Price: {web3.utils.fromWei(itemStakeDict['item'][4], "ether")}
                </Typography>
              </CardContent>
              {/* <CardActions className='border-top'> */}
              <form onSubmit={(e)=> {
                    let amount = web3.utils.toWei(this.stake.value.toString(), 'ether')
                    this.state.topshelf.methods.addItemStake(index, amount).send({from: this.state.account})
                  }}>
                  <div className='form-group mr-sm-2'>
                    <input
                      id='stake'
                      type='number'
                      min='0'
                      step='0.01'
                      className="form-control form-control-md"
                      placeholder='Item price'
                      required
                      ref={(input) => {this.price = input}}
                    />
                  <button size="large">Invest</button>
                  </div>
                </form>
                <div>
            </div>
              {/* </CardActions> */}
            </Card>
            </Col>
          );
          stakeItems = <Row xs={2} md={3} className="g-4">{stakeItems}</Row>
        }
        // let [listingItems, listingsTotal, expiredItems, expiredTotal, stakeItems] = await MarketplaceCard(web3, topshelf, totalListings, numStakes);

        // console.log(listingItems!== null);
        document.getElementById('balance').innerText = String(web3.utils.fromWei(tokenBalance)) + ' TOPS';
        // document.getElementById('openListings').innerHTML = (listingItems!== null ? listingItems : '');
        // document.getElementById('expiredListings').innerHTML = (expiredItems!== null ? expiredItems : '');
        
        this.setState({"token": token, "topshelf": topshelf, "topshelfAddress": topshelfAddress, "tokenBalance": web3.utils.fromWei(tokenBalance, 'ether'), "tokenName": tokenName, "topshelfBalance": topshelfBalance,
                       "listingItems":listingItems, "totalListings": listings.length, "expiredItems": expiredItems, "totalExpiredItems": expired.length, //"stakeItems":stakeItems, "totalStakes":numStakes,
                       "listfee": listfee, "stakerReward":stakerReward, "buyReward":buyReward, "defaultLeaseDuration":defaultLeaseDuration, "renewalRatio":renewalRatio,  "listfeeEth": Web3.utils.fromWei(String(listfee)),//stakerReward
                       })
      } catch (e){
        console.log('error', e)
        window.alert('Contracts not deployed to the current network')
      }
    } else{  //if MetaMask not exists push alert
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
      balance: 0,
      topshelfAddress: null
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
                    <div id='openListings'>{this.state.listings}</div>
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
                {/* <Tab eventKey="Stakes" title="Stakes">
                  <br></br>
                    You have {this.state.numStakes} staked item(s)
                    <br></br>
                    <br></br>
                    {this.state.stakeItems}
                </Tab> */}
                <Tab eventKey="Expired" title="Expired">
                  <div>
                  <br></br>
                    Expired listings: {this.state.totalExpiredItems}
                    <br></br><br></br>
                    <div id='expiredListings'>{this.state.expiredItems}</div>
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