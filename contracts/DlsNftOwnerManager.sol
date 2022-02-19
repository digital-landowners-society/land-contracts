// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DlsNftOwnerManager {
    // DLS NFT Data
    IERC721 public dlsNft;
    IERC20 public landDao;
    mapping(uint256=>bool) private dlsNftOwnerClaimed;
    uint256 public dlsNftSupply = 90_000_000e18;

    event DlsNftClaimed(address owner, uint256[] tokenIds, uint256 claimAmount);

    constructor(address dlsNftAddress){
        dlsNft = IERC721(dlsNftAddress);
        landDao = IERC20(msg.sender);
    }

    // DLS NFT Logic
    function claimNftOwner(uint256[] memory tokenIds) external {
        require(address(dlsNft) != address(0));
        for (uint256 i=0; i<tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(!dlsNftOwnerClaimed[tokenId]);
            require(dlsNft.ownerOf(tokenId) == msg.sender);
            dlsNftOwnerClaimed[tokenId] = true;
        }
        uint256 amount = dlsNftSupply / 10_000 * tokenIds.length;
        landDao.transfer(msg.sender, amount);
        emit DlsNftClaimed(msg.sender, tokenIds, amount);
    }
}
