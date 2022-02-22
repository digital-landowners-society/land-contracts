// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LandOwnerManager is Ownable {

    uint256 public startDate;
    IERC20 public landDao;
    mapping(address=>uint8) private landOwnerClaimed;
    bytes32 public merkleRoot;
    address public treasuryManager;

    // Land Owners
    event MerkleRootChanged(bytes32 merkleRoot);
    event LandOwnerClaimed(address landOwner, uint256 amount, uint256 claimed);
    event TreasuryDistributed(address treasury, uint256 amount);

    constructor(address landDaoOwner, address treasuryManagerAddress)  {
        startDate = block.timestamp;
        landDao = IERC20(msg.sender);
        _transferOwnership(landDaoOwner);
        treasuryManager = treasuryManagerAddress;
    }

    function setMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        require(merkleRoot == bytes32(0), "GasDao: Merkle root already set");
        merkleRoot = _merkleRoot;
        emit MerkleRootChanged(_merkleRoot);
    }

    // Land Owners logic
    function claimLandOwner(uint256 amount, bytes32[] calldata merkleProof) external {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        bool valid = MerkleProof.verify(merkleProof, merkleRoot, leaf);
        require(valid, "Invalid Merkle Proof");
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

    function allowTransferringUnclaimedTokens() public onlyOwner {
        require(block.timestamp > startDate + 180 days);
        uint256 remainingLandOwnerSupply = landDao.balanceOf(address(this));
        landDao.approve(treasuryManager, remainingLandOwnerSupply);
        emit TreasuryDistributed(treasuryManager, remainingLandOwnerSupply);
    }
}