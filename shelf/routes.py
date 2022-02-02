from flask import render_template
from web3 import Web3
import solcx
from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField, TextAreaField
from wtforms.validators import DataRequired, URL, NoneOf
from flask import Flask
import json

app = Flask(__name__)


class NFTForm(FlaskForm):
    title = StringField('Item Name', validators=[DataRequired(), NoneOf(values=['<', '>'], message=" '>' and '<' symbols not allowed")])
    content = TextAreaField('Description', validators=[DataRequired()])
    notes = TextAreaField('Image URI', validators=[DataRequired(), URL()])
    submit = SubmitField('Next')


def get_shelf_contract(return_contract=False):
    w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:7545'))  # Change to infura for testnet
    with open('contract_addresses.json', 'r') as f:
        shelf_address = json.loads(f.read())['item']
    contract_file = 'TopShelf.sol'

    shelf = solcx.compile_files(contract_file)  # todo save ABI to directory
    file_name = contract_file.split('/')[-1][:-4]
    abi, bin = shelf[contract_file + ':' + file_name]['abi'], \
               shelf[contract_file + ':' + file_name]['bin']
    # shelf_contract_interface = w3.eth.contract(bytecode=bin, abi=abi)  # Compiled & turned to python Contract object
    shelf_contract_address = Web3.toChecksumAddress(shelf_address)

    _shelf_contract = w3.eth.contract(abi=abi, address=shelf_contract_address) if return_contract else None# Python contract object
    return _shelf_contract, shelf_contract_address, abi


def get_token_contract(return_contract=False):
    w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:7545'))  # Change to infura for testnet
    with open('contract_addresses.json', 'r') as f:
        token_address = json.loads(f.read())['token']
    contract_file = 'TopToken.sol'

    token = solcx.compile_files(contract_file)  # todo save ABI to directory
    file_name = contract_file.split('/')[-1][:-4]
    abi, bin = token[contract_file + ':' + file_name]['abi'], \
               token[contract_file + ':' + file_name]['bin']
    # shelf_contract_interface = w3.eth.contract(bytecode=bin, abi=abi)  # Compiled & turned to python Contract object
    shelf_contract_address = Web3.toChecksumAddress(token_address)

    _shelf_contract = w3.eth.contract(abi=abi, address=shelf_contract_address) if return_contract else None
    return _shelf_contract, shelf_contract_address, abi


shelf_contract, shelf_contract_address, abi = get_shelf_contract(return_contract=True)
token_contract, token_contract_address, tabi = get_token_contract(return_contract=True)


@app.route('/', methods=['GET', 'POST'])
def nft():
    return render_template('ethereum.html', page=1,
                           abi=json.dumps(abi), recipe_address=shelf_contract_address,
                           tabi=json.dumps(tabi), token_address=token_contract_address, ethereum=True)

@app.route('/stakes', methods=['GET', 'POST'])
def stakes():
    return render_template('stakes.html', page=1,
                           abi=json.dumps(abi), recipe_address=shelf_contract_address,
                           tabi=json.dumps(tabi), token_address=token_contract_address, ethereum=True)


@app.route('/settings', methods=['GET', 'POST'])
def settings():
    return render_template('settings.html', abi=json.dumps(abi), recipe_address=shelf_contract_address,
                           tabi=json.dumps(tabi), token_address=token_contract_address, ethereum=True)


@app.route('/mint', methods=['GET', 'POST'])
def mint_nft():
    form = NFTForm()
    # form.title.label = 'Create Listing'
    return render_template('create_nft.html', legend="Create Listing", form=form,
                           abi=json.dumps(abi),
                           contract_address=shelf_contract_address, recipe_contract=shelf_contract, ethereum=True)


if __name__ == '__main__':
    app.run(debug=True)
