// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

// Deployer acts as operator but is not listed in _allowed by default. Ensure it cannot be

contract TopToken {
    string public name;
    string public symbol;
    address public admin;  // Give privileges to TopShelf
    uint256 public decimals;
    uint256 private _transferFee;
    uint256 private _totalSupply;
    mapping(address=>uint256) private _balances;  // Keep track balances and allowances approved
    mapping(address=>mapping(address=>uint256)) private _allowed;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
    event MinterChanged(address indexed from, address indexed to);

    modifier onlyAdmin(){require(msg.sender==admin, 'Error, only admin'); _;}
    modifier notNullAddress(address _address){require(_address!=address(0), 'Error, using null address not allowed'); _;}
    constructor(string memory _name, string memory _symbol, uint256 _decimals, uint256 _fee){
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        admin = msg.sender;
        _transferFee = _fee;
    }
    // READ FUNCTIONS
    function totalSupply() public view returns(uint256){return _totalSupply;}
    function transferFee() public view returns(uint256){return _transferFee;}
    function balanceOf(address owner) public view returns(uint256){return _balances[owner];}
    function allowance(address owner, address spender) public view returns (uint256){return _allowed[owner][spender];}
    // SET FUNCTIONS
    function setTransferFee(uint256 _fee) external onlyAdmin(){_transferFee = _fee;}
    // FUNCTIONS
    function passMinterRole(address topshelf) public onlyAdmin() returns(bool){
        admin = topshelf;
        emit MinterChanged(msg.sender, topshelf);
        return true;
    }
    function transfer(address to, uint256 value) public returns (bool) {
        // uint256 withFee = _transferFee << value;  // Total cost = value * 2**n (transfer loses 1/(2**n))
        // require(withFee <= _balances[msg.sender], "Error: Insufficient funds");
        require(to != address(0), "Not to null");
        _balances[msg.sender] -= value;  // withFee
        _balances[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    function transferFrom(address from, address to, uint256 value) public returns (bool){
        // uint256 withFee = _transferFee << value;  // Total cost = value * 2**n (transfer loses 1/(2**n))
        // require(withFee <= _balances[from], "Error: Insufficient funds");
        // require(((withFee <= _allowed[from][msg.sender]) || (msg.sender == admin)), // Always allow TopShelf
        //     "Error: transferring more than approved");
        require(to != address(0), "Not to null");

        _balances[from] -= value;  // withFee
        _balances[to] = _balances[to] + value;
        if (msg.sender != admin){  // May be vulnerable
            _allowed[from][msg.sender] -= value;  //withFee
        }
        emit Transfer(from, to, value);
        return true;
    }
    function approve(address spender, uint256 value) public notNullAddress(spender) returns (bool) {
//        require(spender != address(0));
        _allowed[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    function increaseAllowance(address spender, uint256 addedValue) public notNullAddress(spender) returns (bool){
//        require(spender != address(0));
        _allowed[msg.sender][spender] = (_allowed[msg.sender][spender] + addedValue);
        emit Approval(msg.sender, spender, _allowed[msg.sender][spender]);
        return true;
    }
    function decreaseAllowance(address spender, uint256 subtractedValue) public notNullAddress(spender) returns (bool){
//        require(spender != address(0));
        _allowed[msg.sender][spender] = (_allowed[msg.sender][spender] - subtractedValue);  // If subtractedValue>approved?
        emit Approval(msg.sender, spender, _allowed[msg.sender][spender]);
        return true;
    }

    function _mint(address account, uint256 amount) internal notNullAddress(account){
//        require(account != address(0), "Mint to the zero address"); // My change
        _totalSupply = _totalSupply + amount;
        _balances[account] = _balances[account] + amount;
        emit Transfer(address(0), account, amount);
    }
    function mint(address account, uint256 amount) external onlyAdmin(){
        _mint(account, amount);
    }

    function _burn(address account, uint256 amount) internal notNullAddress(account){
//        require(account != address(0), "Mint to the zero address"); // My change
        require(amount <= _balances[account], "Error: Insufficient Funds");

        _totalSupply = _totalSupply - amount;
        _balances[account] = _balances[account] - amount;
        emit Transfer(account, address(0), amount);
    }
    function burn(address account, uint256 amount) external onlyAdmin(){
        _burn(account, amount);
    }

    function _burnFrom(address account, uint256 amount) internal {
        require(amount <= _allowed[account][msg.sender] || msg.sender==admin, "Amount to burn greater than approved");
        if (msg.sender!=admin){  // Allows burn from to reduce allowances if not called from admin
            _allowed[account][msg.sender] = _allowed[account][msg.sender] - amount;
        }
        _burn(account, amount);
        emit Approval(account, msg.sender, _allowed[account][msg.sender]);
    }
    function burnFrom(address account, uint256 amount) external onlyAdmin(){
        _burnFrom(account, amount);
    }
}