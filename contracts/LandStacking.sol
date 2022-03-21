// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract LandStacking is ERC20, ERC20Permit, ERC20Votes {
    IERC20 public immutable landToken;

    uint public rewardRate = 30;
    uint public immutable startBlock;
    uint public immutable endBlock;
    uint public lastUpdateBlock;
    uint public rewardPerTokenStored;

    mapping(address => uint) public userRewardPerTokenPaid;
    mapping(address => uint) public rewards;

    constructor(string memory name_, string memory symbol_, address _landToken)
    ERC20(name_, symbol_)
    ERC20Permit(name_)
    {
        landToken = IERC20(_landToken);
        startBlock = block.number;
        endBlock = block.number + 1e6;
    }

    function rewardPerToken() public view returns (uint) {
        if (totalSupply() == 0) {
            return rewardPerTokenStored;
        }
        uint lastBlock = block.number;
        if (lastBlock > endBlock) {
            lastBlock = endBlock;
        }
        return
        rewardPerTokenStored +
        (((lastBlock - lastUpdateBlock) * rewardRate * 1e18) / totalSupply());
    }

    function earned(address account) public view returns (uint) {
        return
        ((balanceOf(account) *
        (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18) +
        rewards[account];
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        uint lastBlock = block.number;
        if (lastBlock > endBlock) {
            lastBlock = endBlock;
        }
        lastUpdateBlock = lastBlock;

        rewards[account] = earned(account);
        userRewardPerTokenPaid[account] = rewardPerTokenStored;
        _;
    }

    function stake(uint _amount) external updateReward(msg.sender) {
        landToken.transferFrom(msg.sender, address(this), _amount);
        _mint(msg.sender, _amount);
    }

    function withdraw(uint _amount) external updateReward(msg.sender) {
        landToken.transfer(msg.sender, _amount);
        _burn(msg.sender, _amount);
    }

    function getReward() external updateReward(msg.sender) {
        uint reward = rewards[msg.sender];
        rewards[msg.sender] = 0;
        landToken.transfer(msg.sender, reward);
    }

    function _afterTokenTransfer(address from, address to, uint256 amount)
    internal
    override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
    internal
    override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
    internal
    override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }
}
