// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract LPStaking is ERC20, ERC20Permit {
    IERC20 public rewardsToken;
    IERC20 public stakingToken;

    uint public rewardRate = 70e18;
    uint public immutable startBlock;
    uint public immutable endBlock;
    uint public lastUpdateBlock;
    uint public rewardPerTokenStored;

    mapping(address => uint) public userRewardPerTokenPaid;
    mapping(address => uint) public rewards;

    constructor(string memory name_, string memory symbol_, address _stakingToken, address _rewardsToken)
    ERC20(name_, symbol_)
    ERC20Permit(name_)
    {
        stakingToken = IERC20(_stakingToken);
        rewardsToken = IERC20(_rewardsToken);
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
        _mint(msg.sender, _amount);
        stakingToken.transferFrom(msg.sender, address(this), _amount);
    }

    function withdrawAndGetReward(uint _amount) external updateReward(msg.sender) {
        _burn(msg.sender, _amount);
        stakingToken.transfer(msg.sender, _amount);
        uint reward = rewards[msg.sender];
        rewards[msg.sender] = 0;
        rewardsToken.transfer(msg.sender, reward);
    }

    function withdraw(uint _amount) external updateReward(msg.sender) {
        _burn(msg.sender, _amount);
        stakingToken.transfer(msg.sender, _amount);
    }

    function getReward() external updateReward(msg.sender) {
        uint reward = rewards[msg.sender];
        rewards[msg.sender] = 0;
        rewardsToken.transfer(msg.sender, reward);
    }
}
