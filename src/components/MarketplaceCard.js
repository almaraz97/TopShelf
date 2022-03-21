import Card from '@mui/material/Card';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import React from 'react';


export default async function MarketplaceCard(ethers, topshelf, account, totalListings, numStakes) {
  let listings = []
  let expired = []
  for (let i=0 ; i<totalListings; i++) {
    let item = await topshelf.functions.listings(i);
    // let test = new Date(0); test.setUTCSeconds(item[7]); console.log(test.toDateString())
    let expiresIn = (parseInt(item[6])+parseInt(item[7])) - (Date.now()/1000);  // find if delinquent client side
    if (expiresIn>0) {  //!delinquent  // let delinquent = await topshelf.functions.itemDelinquent(i);
      let test = new Date(0); 
      test.setUTCSeconds(item.dateCreated)
      // item = {name:item.name, description:item.description, URI:item.URI, paused:item.pause, 
      //         price:ethers.utils.formatEther(item.price.toString(), 18), stock: item.stock.toString(), leaseDuration: item.leaseDuration.toString(), dateCreated:test}
      listings.push(item);
    } else{
      expired.push(item);
    }
  }

  // for (let [k, v] of Object.entries(obj)) {
  let listingItems = null;
  if (listings.length!==0){
    listingItems = listings.map((item, index) =>
    <Col style={{minHeight: 500, maxHeight:500, maxWidth: 300, minWidth: 300}} key={index}>
        <Card className='my-1'>
            <CardMedia  
              sx={{ maxWidth: 200, maxHeight: 200, minWidth: 200, minHeight: 200 }}
              component="img"
              image={item.URI}
              alt={item.URI}
            justify="center"
          />
        <CardContent sx={{ maxHeight: 200, minHeight: 200 }}>
          <Typography gutterBottom variant="h5" component="div">
          {item.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" >
            {item.description}<br></br>
            Price: {ethers.utils.formatUnits(item.price, 18)}<br></br>
            Lease Duration: {item.leaseDuration.toString()}<br></br>
            Date Created: {item.dateCreated.toString()}<br></br>
            Expires in: {Math.round((((parseInt(item.dateCreated)+parseInt(item.leaseDuration))*1000) - Date.now())/60000)} seconds
          </Typography>
        </CardContent>
        <CardActions className='border-top row'>  {/*sx={{ maxHeight: 150, minHeight: 150 }}*/}
          <Button className='col-12' size="large" onClick={(e)=> {
            console.log(account)
            let itemPrice = item.price.toString()
            topshelf.functions.buyItem(index, {from: account, value: itemPrice})
          }}>Purchase</Button>
          <div>
              <input
                id={'stake' + index}
                type='number'
                min='0.01'
                step='0.01'
                className="col-8 ml-3"
                placeholder='Amount'
                required
              />
              <Button className='col-2 ml-2' size="large" onClick={(e)=> {
                let amount = ethers.utils.parseEther(document.getElementById('stake'+index).value.toString(), 'ether')
                topshelf.functions.addItemStake(index, amount, {from: account})
              }}>Invest</Button>
            </div>
        </CardActions>
      </Card>
    </Col>
    );
    listingItems = <Row xs={4} md={4} className="g-4">{listingItems}</Row>
  } 
  let expiredItems = null;
  if (expired.length!==0){
    expiredItems = expired.map((item, index) =>
    <Col key={index}>
        <Card style={{minHeight: 500, maxHeight:500, maxWidth: 300, minWidth: 300}} className='my-1'>
        <CardMedia  
          sx={{ maxWidth: 200, maxHeight: 200, minWidth: 200, minHeight: 200 }}
          component="img"
          image={item.URI}
          alt={item.URI}
        />
        <CardContent sx={{ maxHeight: 225, minHeight: 225 }}>
          <Typography gutterBottom variant="h5" component="div">
          {item.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" >
            {item.description}<br></br>
            Price: {ethers.utils.formatUnits(item.price.toString(), 18)}
          </Typography>
        </CardContent>
        <CardActions className='border-top row my-1'>  {/*sx={{ maxHeight: 150, minHeight: 150 }}*/}
          <div>
              <input
                id={'stake' + index}
                type='number'
                min='1'
                step='1'
                className="col-8 ml-1"
                placeholder='Amount'
                required
              />
              <Button className='col-2 ml-2' size="large" onClick={(e)=> {
                let amount = ethers.utils.parseEther(document.getElementById('stake'+index).value.toString(), 'ether')
                console.log(amount)
                topshelf.functions.renewItem(index, amount.toString(), {from: account})
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
  // console.log(numStakes)
  while (stakes.length<numStakes){ // Go through item index until all item stakes are retrieved
    // console.log(i, account)
    let stakeId = (await topshelf.functions.itemStakerId(i, account)).toString();
    // console.log(stakeId)
    if (stakeId!==0){
      let stake = await topshelf.functions.itemStake(i, stakeId);
      let stakeAmount = ethers.utils.formatEther(stake.Amount.toString(), 18).toString();
      let item = await topshelf.functions.listings(i);
      stakes.push({'index': i, 'item': item, 'stakeAmount': stakeAmount});
    }
    i+=1;
  }
  // console.log(stakes)
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
          <Typography variant="body2" color="text.secondary" >
            {itemStakeDict['item'][1]}<br></br>
            Price: {ethers.utils.formatUnits(itemStakeDict['item'][4], 18)}<br></br>
            Your Stake: {itemStakeDict['stakeAmount']} TOPs
          </Typography>
        </CardContent>
        {/* <CardActions className='border-top'> */}
        {/* <form onSubmit={(e)=> {
              let amount = ethers.utils.parseEther(this.stake.value.toString())
              this.state.topshelf.functions.addItemStake(index, amount, {from: account})
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
                // ref={(input) => {this.price = input}}
              />
            <button size="large">Invest</button>
            </div>
          </form>
          <div>
      </div> */}
        {/* </CardActions> */}
      </Card>
      </Col>
    );
    stakeItems = <Row xs={2} md={3} className="g-4">{stakeItems}</Row>
  }
  return [listingItems, listings.length, expiredItems, expired.length, stakeItems, stakes.length];
}
/*
<form onSubmit={(e)=> {
                  let amount = ethers.utils.parseEther(this.stake.value.toString()) ////////////////////////////////////////
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
              </form> 
*/