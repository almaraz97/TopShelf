import Card from '@mui/material/Card';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import React from 'react';


export default async function MarketplaceCard(web3, topshelf, totalListings, numStakes) {
  let listings = []
  let expired = []
  for (let i=0 ; i<totalListings; i++) {
    // find if delinquent client side
    let item = await topshelf.methods.listings(i).call();  // await
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
    console.log(expired.length, expiredItems)
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
  console.log(expired.length, expiredItems)
  return [listingItems, listings.length, expiredItems, expired.length, stakeItems];
}
