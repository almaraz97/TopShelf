import { Tabs, Tab } from 'react-bootstrap'
import TopShelf from '../abis/TopShelf.json'
import TopToken from '../abis/TopTopToken.json'
import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';


class App extends Component {

  async componentWillMount() {
    await this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    //check if MetaMask exists
    // if (typeof web3 !== 'undefined') {
    //   App.web3Provider = web3.currentProvider;
    //   const web3 = new Web3(web3.currentProvider);
    // } else {
    //   // If no injected web3 instance is detected, fallback to Ganache.
    //   App.web3Provider = new web3.providers.HttpProvider('http://127.0.0.1:7545');
    //   const web3 = new Web3(App.web3Provider);
    // }
    if(typeof window.ethereum !== 'undefined'){
      //assign to values to variables: web3, netId, accounts
      const web3 = new Web3(window.ethereum)
      // try {
      //   // Request account access if needed
      //   await window.ethereum.enable();
      //   // Acccounts now exposed
      //   return web3;
      // } catch (error) {
      //   console.error(error);
      // }
      const netId = await web3.eth.net.getId()
      const accounts = await web3.eth.getAccounts()

      if (typeof accounts[0]!=='undefined'){  //check if account is detected, then load balance&setStates, else push alert
        const balance = await web3.eth.getBalance(accounts[0])
        this.setState({account: accounts[0], balance: balance, web3: web3})
      }else{
        window.alert('Please sign in with MetaMask')
      }

      // in try block, load contracts
      try {
        const token = new web3.eth.Contract(TopToken.abi, TopToken.networks[netId].address)
        const tokenName = await token.methods.symbol().call()
        const topshelf = new web3.eth.Contract(TopShelf.abi, TopShelf.networks[netId].address)
        const topshelfAddress = topshelf.networks[netId].address
        const tokenBalance = await token.methods.balanceOf(this.state.account).call()
        const topshelfBalance = await topshelf.methods.etherBalanceOf(this.state.account).call()

        this.setState({token: token, topshelf: topshelf, topshelfAddress: topshelfAddress,
          tokenBalance: web3.utils.fromWei(tokenBalance), tokenName: tokenName, topshelfBalance: topshelfBalance})
      } catch (e){
        console.log('error', e)
        window.alert('Contracts not deployed to the current network')
      }

    } else{  //if MetaMask not exists push alert
      window.alert('Please install MetaMask')
    }
  }

  async get_item_count(contract, acc){
    return await contract.methods.balanceOf(acc).call();
  }
  async get_item_info(contract, index, web3){
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
async buyItem(contract, account, index){
    let item = await contract.methods.listings(index).call();
    let price = await item.price;
    price = parseInt(price);
    // [buyFee, buyPay] = [await contract.methods.eatFee().call(), await contract.methods.price().call()]
    contract.methods.buyItem(index).send({from: account, gasPrice: '2000000000', gas:'150000', value:price}).catch(err => {
        window.alert(err); //window.alert('Failed: ' + err)
    })
}
async add_item_stake(web3, contract, acc, id){
  let amount = parseFloat(document.getElementById('investAmount').value);
  if (typeof amount === 'number'){
    amount = web3.utils.toWei(amount.toString(), 'ether')
    contract.methods.addItemStake(id, amount).send({from: acc, gasPrice: '2000000000', gas:'1500000'}).catch(err => {
        window.alert(err);
    })
  } else{
    window.alert('Input not valid');
  }
  // document.Stake = parseFloat(amount.value);
}

  // async deposit(amount) {
  //   if (this.state.topshelf !== 'undefined') {  //check if this.state.dbank is ok
  //     //in try block call dBank deposit();
  //     try{
  //     await this.state.topshelf.methods.deposit().send({value: amount.toString(), from: this.state.account})
  //     } catch (e){
  //       console.log('Error, deposit: ', e)
  //     }
  //   }
  // }
  // async withdraw(e) {
  //   //prevent button from default click
  //   e.preventDefault()
  //   //check if this.state.dbank is ok
  //   if(this.state.topshelf !=='undefined'){
  //     try{  //in try block call dBank withdraw();
  //       await this.state.topshelf.methods.withdraw().send({from: this.state.account})
  //     } catch(e) {
  //       console.log('Error, withdraw: ', e)
  //     }
  //   }
  // }


  constructor(props) {
    super(props)
    this.state = {
      web3: 'undefined',
      account: '',
      token: null,
      dbank: null,
      balance: 0,
      dBankAddress: null,
      interest: 0
    }
  }

  render() {
    return (
      <div className='text-monospace'>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="http://www.dappuniversity.com/bootcamp"
            target="_blank"
            rel="noopener noreferrer"
          >
        <img src={dbank} className="App-logo" alt="logo" height="32"/>
          <b>dBank</b>
        </a>
        </nav>
        <div className="container-fluid mt-5 text-center">
        <br></br>
          <h1>Welcome to Second Sons Bank</h1>
          <h2>{this.state.account}</h2>
          <br></br>
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
              <Tabs defaultActiveKey="profile" id="uncontrolled-tab-example">
                <Tab eventKey="deposit" title="Deposit">
                  <div>
                  <br></br>
                    How much do you want to deposit?
                    <br></br>
                    (min. amount is 0.01 ETH)
                    <br></br>
                    (1 deposit is possible at the time)
                    <br></br>
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      let amount = this.depositAmount.value
                      amount = Web3.utils.toWei(amount) //convert to wei
                      this.deposit(amount)
                    }}>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                        <input
                          id='depositAmount'
                          step="0.01"
                          type='number'
                          className="form-control form-control-md"
                          placeholder='amount...'
                          required
                          ref={(input) => { this.depositAmount = input}}
                        />
                      </div>
                      <button type='submit' className='btn btn-primary'>DEPOSIT</button>
                    </form>
                  </div>
                </Tab>

                <Tab eventKey="withdraw" title="Withdraw">
                  <br></br>
                    Do you want to withdraw + take interest?
                    <br></br>
                    You have {this.state.dBankBalance} ETH deposited.
                    <br></br>
                    <br></br>
                  <div>
                    <button type='submit' className='btn btn-primary' onClick={(e) => this.withdraw(e)}>WITHDRAW</button>
                  </div>
                </Tab>
                <Tab eventKey="interest" title="Interest">
                  <br></br>
                    You have {this.state.tokenBalance} {this.state.tokenName} tokens
                    <br></br>
                    <br></br>
                  <div>
                    <button type='submit' className='btn btn-primary' onClick={(e) => this.withdraw(e)}>WITHDRAW</button>
                  </div>
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