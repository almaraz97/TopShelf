import time
import solcx
from web3 import Web3
import json


def defaults():
    w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:7545'))
    _account_address = '0xa55C4F3f1a5d0CeC644aDC47b863FB78c36EB3E1'
    key = '0x425b054e56a2db4837701e99fa04706083a6a8a003086e6848b28041142a5f33'
    return w3, _account_address, key


def account2():
    _account_address = '0xc331433D046519D5568fEfCD9AeC9ce6C1117133'
    key = '0x98c8e788ee0cdbcfc8579c97abaec577f21678bb3f7419b0771dc90399207234'
    return _account_address, key


def compile_contract(contract_file):
    contract = solcx.compile_files(contract_file)
    contract_name = contract_file.split('/')[-1][:-4]
    return contract[contract_file + ':' + contract_name]['abi'], contract[contract_file + ':' + contract_name]['bin']


def deploy_token_contract(w3, contract_file, _key):
    acct = w3.eth.account.privateKeyToAccount(_key) #    print(acct.address, ': ',  w3.eth.getTransactionCount(acct.address))
    abi, bin = compile_contract(contract_file)
    token_contract = w3.eth.contract(bytecode=bin, abi=abi)  # Compiled and turned into python Contract object

    # # Deploy token contract # #
    name, symbol, decimals = "TopShelfToken", "TOPS", 18
    tokenTransferFee = 0
    construct_txn = token_contract.constructor(name, symbol, decimals, tokenTransferFee).buildTransaction({'from': acct.address, 'nonce': w3.eth.getTransactionCount(acct.address),'gas': 2_287_120,'gasPrice': w3.toWei('21', 'gwei')})
    signed = acct.signTransaction(construct_txn)
    tx_hash = w3.eth.sendRawTransaction(signed.rawTransaction)  # Deploy contract
    tx_receipt = w3.eth.waitForTransactionReceipt(tx_hash)#; print(tx_hash.hex())
    
    token_address = tx_receipt['contractAddress']  # Get deployed contract address
    print("Token Deployed At:", token_address) # token_contract_address = Web3.toChecksumAddress(token_address)  # Why checksum?
    token_contract_instance = w3.eth.contract(abi=abi, address=token_address)

    # # Call contract item supply function # #
    tx = token_contract_instance.functions.mint(acct.address, 256).buildTransaction({'nonce': w3.eth.getTransactionCount(acct.address), "gasPrice": w3.eth.gas_price})
    signed_tx = w3.eth.account.signTransaction(tx, _key) # Get tx receipt to get contract address
    # tx_receipt = w3.eth.getTransactionReceipt(tx_hash)
    # hash = w3.eth.sendRawTransaction(signed_tx.rawTransaction); # print(hash.hex())
    return token_contract_instance, str(token_address)

def deploy_topshelf_contract(token_address, w3, contract_file, key, _listFee):  # token_contract_address,
    acct = w3.eth.account.privateKeyToAccount(key)
    topshelf = solcx.compile_files('TopShelf.sol')
    contract_name = contract_file.split('/')[-1][:-4]
    abi, bin = topshelf[contract_file + ':' + contract_name]['abi'], \
               topshelf[contract_file + ':' + contract_name]['bin']
    topshelf_contract_interface = w3.eth.contract(bytecode=bin, abi=abi)  # Compiled and turned into python Contract object

    _buyReward, _transferFee = int(1), 1
    _defaultLeaseDuration, _renewalRatio, _foreclosureFee = 5, 1, int(5e18)
    _stakerReward, _unstakePenalty = 1, 1
    # shelf_params = {'_listFee':int(1e13), '_buyReward':1, '_transferFee':1, '_defaultLeaseDuration': 5, '_renewalFee':int(1e18), '_renewalRatio':1, '_foreclosureFee':int(5e18), 'tokenTransferFee':0, '_stakerReward':1, '_unstakePenalty':1}

    name, symbol, _token = "TopShelf", "TPL", token_address
    construct_txn = topshelf_contract_interface.constructor(name, symbol, _token, _listFee, _transferFee, _foreclosureFee, 
                      _stakerReward, _unstakePenalty, _buyReward, _defaultLeaseDuration, _renewalRatio
                      ).buildTransaction({
                        'from': acct.address,
                        'nonce': w3.eth.getTransactionCount(acct.address),
                        'gas': 6_287_120,
                        'gasPrice': w3.toWei('20', 'gwei')})
    signed = acct.signTransaction(construct_txn)
    tx_hash = w3.eth.sendRawTransaction(signed.rawTransaction)  # Deploy contract on-chain
    # print(tx_hash.hex())
    tx_receipt = w3.eth.waitForTransactionReceipt(tx_hash)
    topshelf_address = tx_receipt['contractAddress']  # Get deployed contract adcdress
    print("Topshelf Deployed At:", topshelf_address)
    topshelf_contract_address = Web3.toChecksumAddress(topshelf_address)  # Why checksum?
    topshelf_contract = w3.eth.contract(abi=abi, address=topshelf_contract_address)
    return topshelf_contract, topshelf_contract_address

def deploy_both(_w3, _key, _listFee):
    token_contract_instance, token_address = deploy_token_contract(_w3, 'TopToken.sol', _key)
    topshelf_contract, topshelf_contract_address = deploy_topshelf_contract(token_address, _w3, 'TopShelf.sol', _key, _listFee)
    with open('contract_addresses.json', 'w') as f:
        f.write(json.dumps({'token': token_address, 'item':topshelf_contract_address}))
    return (token_contract_instance, token_address), (topshelf_contract, topshelf_contract_address)

####################################################### Contract Calls ####################################################################
def sign_send(w3, tx, k):
    signed_tx = w3.eth.account.signTransaction(tx, k) 
    tx_hash = w3.eth.sendRawTransaction(signed_tx.rawTransaction)
    return tx_hash

def token_mint(contract, acc, amount, w3, k):
    amount = w3.toWei(amount, 'ether')
    tx = contract.functions.mint(acc, amount).buildTransaction(
        {'nonce': w3.eth.getTransactionCount(acc), "gasPrice": w3.eth.gas_price})
    sign_send(w3, tx, k)
    bal = contract.functions.balanceOf(acc).call()
    return w3.fromWei(bal, 'ether')

def token_mint_to(contract, acc, _to, amount, w3, k):
    amount = w3.toWei(amount, 'ether')
    tx = contract.functions.mint(_to, amount).buildTransaction(
        {'nonce': w3.eth.getTransactionCount(acc), "gasPrice": w3.eth.gas_price})
    sign_send(w3, tx, k)
    bal = contract.functions.balanceOf(_to).call()
    return w3.fromWei(bal, 'ether')

def passMinter(contract, topshelf_contract_address, w3, _acc, k):
    tx = contract.functions.passMinterRole(topshelf_contract_address).buildTransaction(
        {'nonce': w3.eth.getTransactionCount(_acc), "gasPrice": w3.eth.gas_price})
    return sign_send(w3, tx, k)

def mint_listing(contract, _acc, _key, w3, name, description, URI, price, paused, stock, _listFee):
    tx = contract.functions.mint(name, description, URI, price, paused, stock).buildTransaction( # acc, 
        {'nonce': w3.eth.getTransactionCount(_acc), 'value': _listFee, "gasPrice": w3.eth.gas_price, 'gas': 6_287_120})
    return sign_send(w3, tx, _key)

def buy_item(contract, _acc, itemId, w3, _k):
    # print('Owner count before purchase', contract.functions.ownerItemCount(acc).call())
    item_price = contract.functions.listings(itemId).call()[-6]
    tx = contract.functions.buyItem(itemId).buildTransaction(
        {'nonce': w3.eth.getTransactionCount(_acc), 'value': item_price, "gasPrice": w3.eth.gas_price})
    tx_hash = sign_send(w3, tx, _k)
    # retVal = w3.eth.getTransactionReceipt(tx_hash)#['logs'][0]['data']
    # print(retVal)
    return item_price

def add_stake(contract, acc, itemId, amount, w3, k):
    tx = contract.functions.addItemStake(itemId, amount).buildTransaction(
        {'nonce': w3.eth.getTransactionCount(acc), 'gasPrice': w3.eth.gas_price, 'gas': 6721975})
    return sign_send(w3, tx, k)
def remove_stake(contract, acc, itemId, amount, w3, k):
    tx = contract.functions.removeItemStake(itemId, amount).buildTransaction(
        {'nonce': w3.eth.getTransactionCount(acc), 'gasPrice': w3.eth.gas_price, 'gas': 6721975})
    return sign_send(w3, tx, k)

def renew_listing(contract, acc, itemId, amount, w3, k):
    tx = contract.functions.renewItem(itemId, amount).buildTransaction(
        {'nonce': w3.eth.getTransactionCount(acc), 'gasPrice': w3.eth.gas_price, 'gas': 6721975})
    return sign_send(w3, tx, k)

def foreclose_listing(contract, acc, itemId, w3, k):
    tx = contract.functions.forecloseItem(itemId).buildTransaction(
        {'nonce': w3.eth.getTransactionCount(acc), 'gasPrice': w3.eth.gas_price, 'gas': 6721975})
    return sign_send(w3, tx, k)
def foreclose_renovate_listing(contract, acc, itemId, _name, _price,  _description, w3, k):
    tx = contract.functions.forecloseRenovate(itemId, _name, _price,  _description).buildTransaction(
        {'nonce': w3.eth.getTransactionCount(acc), 'gasPrice': w3.eth.gas_price, 'gas': 6721975})
    return sign_send(w3, tx, k)

def transfer_token(contract, acc, to, item_id, w3, key):
    tx = contract.functions.transfer(to, item_id).buildTransaction(
        {'nonce': w3.eth.getTransactionCount(acc), 'gas': 6721975, "gasPrice": w3.eth.gas_price})
    return sign_send(w3, tx, key)

def get_totalSupply(contract):
    return contract.functions.totalSupply().call()

def get_transfers(contract):
    event_filter = contract.events.Transfer.createFilter(fromBlock="latest")
    return event_filter.get_new_entries()

def prev_post_tokens(token_contract, address, func, title):
    prev = token_contract.functions.balanceOf(address).call()
    func()
    post =token_contract.functions.balanceOf(address).call()
    print(f'{title}- Prev: {prev}, Post: {post}, Diff: {post-prev}')

##################################################### Testing Functions ####################################################################
def test(x):
    return '✅' if x else '❌'

def test_deployment(seller_address, w3, key, buyer_address, _listFee):
    (token_contract, token_address), (item_contract, item_address) = deploy_both(w3, key, _listFee)

    seller_bal = token_mint(token_contract, seller_address, 100, w3, key)
    buyer_bal = token_mint_to(token_contract, seller_address, buyer_address, 100, w3, key)
    contract_bal = token_mint_to(token_contract, seller_address, item_address, 1000, w3, key)
    print(f'- S: {seller_bal} ' f'- B: {buyer_bal} ' f'- C: {contract_bal} ')

    passMinter(token_contract, item_address, w3, seller_address, key); print(f'TopShelf is Token Admin: {test(token_contract.functions.deployer().call() == item_address)}')
    return (token_contract, token_address), (item_contract, item_address)
def test_token(token_contract, seller_address, buyer_address, w3):
    """ 
    1. 
    2. 
    3. 
    4. 
    """
    # GET TOKEN TRANSFER FEE
    print(f'- Token transfer fee: {token_contract.functions.transferFee().call()}')
    # GET ACCOUNT TOKEN BALANCES
    token_bal, token_bal2 = token_contract.functions.balanceOf(seller_address).call(), token_contract.functions.balanceOf(buyer_address).call()
    print(f'- Seller token balance: {w3.fromWei(token_bal, "ether")}\n'
          f'- Buyer token balance {w3.fromWei(token_bal2, "ether")}')
    # CANT TRANSFER TOKENS ONLY STAKE? # CONSUMER SENDS TOKEN TO CREATOR  todo decremented, incremented and success
    if False:
        transfer_token(token_contract, buyer_address, seller_address, int(1e16), w3, key2)
        _token_bal, _token_bal2 = token_contract.functions.balanceOf(seller_address).call(), token_contract.functions.balanceOf(buyer_address).call()
        print(f'Token transferred: {test(((token_bal-_token_bal == 1) and (w3.fromWei(token_bal2-_token_bal2, "ether") == -1)))}'
            f'(Cr: {w3.fromWei(token_bal2, "ether")} Cu: {w3.fromWei(_token_bal2, "ether")})')

def test_listing(item_contract, seller_address, key, w3, _listFee):
    prev_balance = w3.eth.getBalance(seller_address)
    mint_listing(item_contract, seller_address, key, w3, 'CryptoPunk', 'Much Value!',
                 'https://static01.nyt.com/images/2021/03/12/arts/11nft-auction-cryptopunks-print/11nft-auction-cryptopunks-print-jumbo.jpg?quality=75&auto=webp',
                 price=int(2e16), paused=False, stock=10, _listFee=_listFee)
    print(f'Item minted: {test(item_contract.functions.listings(0).call())}'); print(item_contract.functions.listings(0).call())

    print(f'Item not delinquent: {test(not item_contract.functions.itemDelinquent(0).call())}')

    print(f'Seller owns item: {test(item_contract.functions.ownerOf(0).call() == seller_address)} {item_contract.functions.ownerOf(0).call()} == {seller_address}')

    cur_balance = w3.eth.getBalance(seller_address)
    print(f'Seller spent ETH mint fee: {test(((prev_balance - cur_balance) >= _listFee))}')

    print(f'Listing supply increased: {test(item_contract.functions.totalSupply().call() == 1)}')

def test_purchasing(item_contract, token_contract, _buyer_address, _key2, _seller_address, w3):  
    """WHY CAN ONLY SELLER BUY FROM BUYER_ADDRESS, BUT NOT BUYER BUY FROM SELLER ADDRESS??"""  # Todo fix buyer only
    s_balance, b_balance = w3.eth.getBalance(_seller_address), w3.eth.getBalance(_buyer_address)  # ETH Balance

    b_token, token_sup = token_contract.functions.balanceOf(_buyer_address).call(), token_contract.functions.totalSupply().call()  # Token Balance/supply
    item_price = buy_item(item_contract, _buyer_address, 0, w3, _key2)
    print(f'Item was purchased: {test(item_contract.functions.listings(0).call()[8] > 0)}')  # Make dynamic

    b_balance2 = w3.eth.getBalance(_buyer_address)
    print(f'Buyer paid item price: {test(b_balance2 <= b_balance-item_price)}')  # Includes gas cost #(prev_balance2-cur_balance2) >= item_price

    print(f'Seller was paid: {test((w3.eth.getBalance(_seller_address) - s_balance) == item_price)}')

    b_diff = token_contract.functions.balanceOf(_buyer_address).call()-b_token
    print(f'Buyer rewarded token(s) for buying item: {test(b_diff>=item_price)} {float(w3.fromWei(b_diff, "ether")), float(w3.fromWei(item_price, "ether"))}');  
    print('Before', w3.fromWei(b_token, 'ether'), 'After', w3.fromWei(token_contract.functions.balanceOf(_buyer_address).call(), 'ether'), float(w3.fromWei(b_diff, "ether")))
    print(f'Total supply increased: {test(token_contract.functions.totalSupply().call() > token_sup)}, Change: {w3.fromWei(token_contract.functions.totalSupply().call()-token_sup, "ether")}, (Total {w3.fromWei(token_contract.functions.balanceOf(_buyer_address).call(), "Ether")})')

def test_renewing(item_contract, token_contract, buyer_address, key2, seller_address, key, w3, _listFee, _defaultLeaseDuration):
    print(f'Item expiry time: {item_contract.functions.itemExpiryDate(0).call()} Current: {int(time.time())}')
    # print(f'Item is delinquent: {"✅"}')
    # item RENEWAL FEE
    # print(f'- Renewal token fee: {item_contract.functions.renewalFee().call()}')
    # item DELINQUENT
    is_del = item_contract.functions.itemDelinquent(0).call()
    # buy_item(item_contract, seller_address, 0, w3, key)
    while not is_del:  # HAVE BUYER OR SELLER MINT AN ITEM?
        print("- Mint new item in interim")
        mint_tests(item_contract, seller_address, key, w3, 'https://static01.nyt.com/images/2021/07/24/business/23wealth/23wealth-superJumbo.jpg', 'Lebron Jaames', '!', _listFee)
        cur_time = w3.eth.get_block('latest')['timestamp']
        print(f'- Time left till first item expiry: {item_contract.functions.itemExpiryDate(0).call()-cur_time}')
        time.sleep(_defaultLeaseDuration)  # eat_item(item_contract, buyer_address, 0, w3, key)
        is_del = item_contract.functions.itemDelinquent(0).call()
    # RENEW item
    total_token1 = w3.fromWei(token_contract.functions.totalSupply().call(), 'ether')
    s_token = token_contract.functions.balanceOf(seller_address).call()
    print(f'- Seller token balance before renewal: {w3.fromWei(s_token, "ether")}\n- Token totalSupply {total_token1}')
    renew_listing(item_contract, seller_address, 0, int(20e18), w3, key)
    print(f'Item renewed: {test(not item_contract.functions.itemDelinquent(0).call())}', f"Expires in {item_contract.functions.itemExpiryDate(0).call()-w3.eth.get_block('latest')['timestamp']} seconds")  # print(f'item was renewed: {test(item_contract.functions.listings(0).call()[6] > 1)}')
    # CREATOR PAID FEE IN TOKENS
    post_token_balance = token_contract.functions.balanceOf(buyer_address).call()
    print(f'Seller paid renewal fee: {test(token_contract.functions.balanceOf(seller_address).call() < s_token)} ({w3.fromWei(token_contract.functions.balanceOf(seller_address).call(), "ether")})')
    # TOKENS BURNED
    total_token2 = w3.fromWei(token_contract.functions.totalSupply().call(), 'ether')
    print(f'Renewal fee burned: {test(total_token1 > total_token2)} Current: {total_token2}')

def test_foreclosing(item_contract, seller_address, key, buyer_address, key2, w3, _listFee):
    try:  # ONLY FORECLOSE DELINQUENT LISTINGS
        foreclose_listing(item_contract, buyer_address, 0, w3, key2); print(f'item early foreclosure succeeded: {"❌"}')
    except Exception:
        print(f'item early foreclosure failed: {"✅"}')
    print(f'- item not delinquent: {test(not item_contract.functions.itemDelinquent(0).call())}')
    # print(item_contract.functions.totalSupply().call()); # mint_tests(item_contract, buyer_address, key2, w3, 'tinyurl.com/338kkn3v', 'Iconic', 'Very Fancy', _listFee)
    # mint_tests(item_contract, buyer_address, key2, w3, 'tinyurl.com/3yn4zw65', 'Booty', 'No comment', _listFee); print()
    time.sleep(2)
    expire_epoch = item_contract.functions.itemExpiryDate(0).call()
    seconds = int(expire_epoch - time.time()); print('expires in', seconds, 'seconds')
    print("- Mint in interim"); time.sleep(seconds+1)
    mint_tests(item_contract, seller_address, key, w3, 'https://lh3.googleusercontent.com/tjx-hcOdSLOgLX0SnY6hrwWLLvwj2DP9DFhrvZCnb7vWx2GsHW88t0Z1luoJwv90uPiUq-Y_hc3EEIoPSz27Yei9_QiJuhmv2_jc=w600', 'Picture', 'Wanna Buy?', _listFee)
    print('Expiry epoch', item_contract.functions.itemExpiryDate(0).call(), 'Current:', w3.eth.get_block('latest')['timestamp'])

    # assert item_contract.functions.itemDelinquent(0).call()
    # FORECLOSE item
    passed = True if foreclose_listing(item_contract, buyer_address, 0, w3, key2) else False
    print(f'Item foreclosed: {passed}', f"Buyer now owns item {item_contract.functions.ownerOf(0).call()} == {buyer_address}")
    #  ONLY FORECLOSE RENOVATE DELINQUENT listings
    try: # contract, acc, itemId, _name, _price,  _description, w3, k
        passed = True if foreclose_renovate_listing(item_contract, seller_address, 0, 'Take back', int(69e14), 'Not yours', w3, key) else False
    except Exception as e:
        print(e)
        print(f'Item early foreclosure failed: {True}')
    
    time.sleep(2)
    seconds = item_contract.functions.itemExpiryDate(0).call() - time.time()
    time.sleep(seconds+1) if seconds>0 else None
    mint_tests(item_contract, buyer_address, key2, w3, 'https://tinyurl.com/ycknvtdc', 'Dope', 'The Dopest', _listFee)
    # FORECLOSE RENOVATE
    try:  # _itemId, string memory _name, uint256 _price, string memory _description
        passed = True if foreclose_renovate_listing(item_contract, seller_address, 0, 'Take back', int(69e14), 'Not yours', w3, key) else False
        print(f'Item foreclosured and renovated: {passed}')
    except Exception as e:
        print(e)
        print(f'Item foreclosured and renovated: {False}')

def test_staking(item_contract, token_contract, seller_address, key, buyer_address, key2, w3):
    """ 
    1. STAKE TOKENS INTO ITEM
    2. EARN TOKEN YIELD FROM PURCHASES
    3. ADD ANOTHER STAKER
    4. EARN FRACTION OF YIELD
    5. GET KICKED OUT OF STAKING
    """
    print(f"Staker tokens before: {w3.fromWei(token_contract.functions.balanceOf(buyer_address).call(), 'ether')}")
    print(f"Current item stake {item_contract.functions.listings(0).call()[-1]}")
    add_stake(item_contract, buyer_address, 0, int(50e18), w3, key2); print(f"Stake added")
    print('Item staked', w3.fromWei(item_contract.functions.listings(0).call()[-1], 'ether'))
    # print(f"StakeId = {item_contract.functions.getstakerItemStakeId(buyer_address, 0).call()}")
    # print(f"Stake amounts = {item_contract.functions.getStakedAmounts(0).call()}")
    test_purchasing(item_contract, token_contract, buyer_address, key2, seller_address, w3)
    print(f"Tokens after: {w3.fromWei(token_contract.functions.balanceOf(buyer_address).call(), 'ether')}")
    # remove_stake(item_contract, buyer_address, 0, int(50e18), w3, key2)
    # passed = item_contract.functions.listings(0).call()
    # print('Item unstaked', w3.fromWei(passed[-1], 'ether'))
    # test_purchasing(item_contract, token_contract, buyer_address, key2, seller_address, w3)
    return

def test_set_values():
    """ 
    1. setTokenAddress
    2. setTransferFee
    3. setMintFee
    4. setEatPay
    5. setDefaultLeaseDuration
    6. setRenewalRatio
    7. setForeclosureFee
    """
    return

def deploy_test():
    _w3, _seller_address, _key = defaults(); _buyer_address, _key2 = account2() # w3, seller_address, key, buyer_address, key2  = W3, account_address, account_key, account_address2, account_key2
    _listFee = int(1e13)
    print(); print("---------Deploy----------")
    (token_contract, token_address), (item_contract, item_address) = test_deployment(_seller_address, _w3, _key, _buyer_address, _listFee); 
    print("-----------List-----------")
    test_listing(item_contract, _seller_address, _key, _w3, _listFee)
    print("---------Purchase---------")
    test_purchasing(item_contract, token_contract, _buyer_address, _key2, _seller_address, _w3)
    print("----------Token-----------")
    test_token(token_contract, _seller_address, _buyer_address, _w3)
    print("----------Renew-----------")
    test_renewing(item_contract, token_contract, _buyer_address, _key2, _seller_address, _key, _w3, int(1e13), 5)
    print("--------Foreclose---------")
    test_foreclosing(item_contract,_seller_address, _key, _buyer_address, _key2, _w3, _listFee)
    print("---------Staking----------")
    test_staking(item_contract, token_contract, _seller_address, _key, _buyer_address, _key2, _w3)
    # WITHDRAW CONTRACT ETH
    return (token_contract, token_address), (item_contract, item_address)


def mint_tests(item_contract, __account_address, _key, w3, href, title, des, _listFee):
    prev_supply = item_contract.functions.totalSupply().call()
    prev_balance = w3.eth.getBalance(__account_address)
    rid = prev_supply

    mint_listing(item_contract, __account_address, _key, w3, 'Iconic', 'An Instant Classic',
                 href, price=int(2e16), paused=False, stock=10, _listFee=_listFee)
    passed = '✅' if item_contract.functions.listings(rid).call() else '❌'
    print(f'item minted: {passed}')
    # item NOT DELINQUENT
    passed = item_contract.functions.itemDelinquent(rid).call()
    print(f'item not delinquent: {not passed}')
    # CREATOR OWNS item
    passed = '✅' if item_contract.functions.ownerOf(rid).call() == __account_address else '❌'
    print(f'Seller owns minted item: {passed}')
    # CREATOR PAID MINTING FEE (_listFee + gas)
    cur_balance = w3.eth.getBalance(__account_address)
    passed = '✅' if ((prev_balance - cur_balance) >= _listFee) else '❌'
    print(f'Seller spent mint fee: {passed}')
    # item SUPPLY INCREASED
    passed = '✅' if item_contract.functions.totalSupply().call() == 1+prev_supply else '❌'
    print(f'Item supply increased: {passed}')
    print()
    return prev_balance, cur_balance


def buy_tests(item_contract, token_contract, _account_address2, cur_balance, w3, key2, _buyReward):
    # BUY ITEM TIMES PURCHASED INCREASED
    prev_balance2 = w3.eth.getBalance(_account_address2)
    buy_item(item_contract, _account_address2, 0, w3, key2)
    passed = '✅' if item_contract.functions.listings(0).call()[9] == 1 else '❌'
    print(f'item was eaten: {passed}')
    # CONSUMER PAID EAT COST
    cur_balance2 = w3.eth.getBalance(_account_address2)
    passed = '✅' if (prev_balance2 - cur_balance2) > (_buyReward) else '❌'
    print(f'Consumer paid fee: {passed}')
    # CREATOR GOT PAID
    passed = '✅' if (w3.eth.getBalance(_account_address2) - cur_balance) > _buyReward else '❌'
    print(f'Creator was paid: {passed}')
    # CONSUMER COMPENSATED WITH TOKEN
    passed = '✅' if token_contract.functions.balanceOf(_account_address2).call() == 1 else '❌'
    print(f'Consumer rewarded token for eating item: {passed}')
    # TOKEN SUPPLY INCREASED
    passed = '✅' if token_contract.functions.totalSupply().call() == 1 else '❌'
    print(f'Total supply increased: {passed}')
    return