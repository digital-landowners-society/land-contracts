// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract LandDAO is ERC20, ERC20Permit, Ownable {
    IERC721 public immutable dlsNft;
    uint256 public immutable startDate;
    bytes32 public landOwnerMerkleRoot;
    bytes32 public allowlistMerkleRoot;
    uint256 landOwnersSupply = 90_000_000e18;
    mapping(string => uint256) public supplyData;
    mapping(uint256=>bool) public dlsNftOwnerClaimed;
    mapping(address=>uint8) public landOwnerClaimed;
    bool public claimEnabled;

    // CONSTRUCTOR
    constructor(string memory name_, string memory symbol_, address dlsNftAddress) ERC20(name_, symbol_) ERC20Permit(name_) {
        dlsNft = IERC721(dlsNftAddress);
        startDate = block.timestamp;
        _mint(address(this), 1e27);
        supplyData["poolRewards"] = 340_000_000e18;
        supplyData["singleStackingRewards"] = 30_000_000e18;
        supplyData["liquidityPoolRewards"] = 70_000_000e18;
        supplyData["dlsDao"] = 90_000_000e18;
        supplyData["liquidityManagement"] = 20_000_000e18;
        supplyData["treasury"] = 100_000_000e18;
        supplyData["team"] = 120_000_000e18;
        supplyData["strategicSale"] = 50_000_000e18;
    }


    function setClaimEnabled(bool _claimEnabled) external onlyOwner {
        claimEnabled = _claimEnabled;
    }
    function sendTokens(string memory supplyName, address contractAddress) external onlyOwner {
        require(contractAddress!=address(0), "LandDao: Should sent to someone");
        uint256 supply = supplyData[supplyName];
        require(supply > 0, "LandDao: not eligible");
        _transfer(address(this), contractAddress, supply);
        supplyData[supplyName] = 0;
    }

    // Land Owners logic
    function claimLandOwner(uint256 amount, bytes32[] calldata landOwnerMerkleProof) external {
        require(claimEnabled, "LandDAO: Claiming not enabled");
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        bool valid = MerkleProof.verify(landOwnerMerkleProof, landOwnerMerkleRoot, leaf);
        require(valid, "LandDAO: invalid Merkle Proof");
        uint256 _halfDate = startDate + 60 days;
        uint256 _endDate = _halfDate + 120 days;
        require(block.timestamp <= _endDate, "LandDAO: date out of range");
        uint8 claimed = landOwnerClaimed[msg.sender];
        require(claimed < 2, "LandDAO: already claimed");
        if (block.timestamp < _halfDate) {
            require(claimed == 0, "LandDAO: already claimed");
            claimed = 1;
            amount = amount / 2;
        } else {
            if (claimed == 1) {
                amount = amount / 2;
            }
            claimed = 2;
        }
        landOwnerClaimed[msg.sender] = claimed;
        landOwnersSupply -= amount;
        _transfer(address(this), msg.sender, amount);
    }

    function transferringUnclaimedTokens(address treasuryManager) public onlyOwner {
        require(block.timestamp > startDate + 180 days, "LandDAO: landowners claim not finished yet");
        _transfer(address(this), treasuryManager, landOwnersSupply);
    }

    // DLS NFT Logic
    function claimNftOwner(uint256[] memory tokenIds) external {
        require(claimEnabled, "LandDAO: Claiming not enabled");
        for (uint256 i=0; i<tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(!dlsNftOwnerClaimed[tokenId], "LandDAO: tokens for NFT already claimed");
            require(dlsNft.ownerOf(tokenId) == msg.sender, "LandDAO: NFT belongs to different address");
            dlsNftOwnerClaimed[tokenId] = true;
        }
        uint256 amount = 9_000e18 * tokenIds.length;
        _transfer(address(this), msg.sender, amount);
    }

    function setLandOwnerMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        landOwnerMerkleRoot = _merkleRoot;
    }

    function setAllowlistMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        allowlistMerkleRoot = _merkleRoot;
    }
}
