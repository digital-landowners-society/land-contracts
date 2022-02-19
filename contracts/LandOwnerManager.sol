// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LandOwnerManager{

    uint256 public startDate;
    IERC20 public landDao;
    mapping(address=>uint8) private landOwnerClaimed;

    // Land Owners
    event LandOwnerClaimed(address landOwner, uint256 amount, uint256 claimed);

    constructor()  {
        startDate = block.timestamp;
        landDao = IERC20(msg.sender);
    }

    // Land Owners logic
    function claimLandOwner(uint256 amount) external {
        // TODO check Merkle Proof
        uint256 _halfDate = startDate + 60 days;
        uint256 _endDate = _halfDate + 120 days;
        require(block.timestamp <= _endDate);
        uint8 claimed = landOwnerClaimed[msg.sender];
        require(claimed < 2);
        if (block.timestamp < _halfDate) {
            require(claimed == 0);
            claimed = 1;
            amount = amount / 2;
        } else {
            if (claimed == 1) {
                amount = amount / 2;
            }
            claimed = 2;
        }
        landOwnerClaimed[msg.sender] = claimed;
        require(landDao.balanceOf(address(this)) >= amount);
        landDao.transfer(msg.sender, amount);
        emit LandOwnerClaimed(msg.sender, amount, claimed);
    }
}