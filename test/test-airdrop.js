const { ethers, network} = require("hardhat");
const utils = ethers.utils;
const { MerkleTree } = require("merkletreejs");
const hash = require("keccak256");
const {expect} = require("chai");

const deployLandDao = async (nftAddress) => {
  if (!nftAddress) {
    nftAddress = "0x0000000000000000000000000000000000000000";
  }
  const landDaoFactory = await ethers.getContractFactory("LandDAO");
  const landDao = await landDaoFactory.deploy(
    "LandDAO",
    "LAND",
    nftAddress
  );
  await landDao.deployed();
  return landDao;
};

const deployNft = async (holders) => {
  const mockNftFactory = await ethers.getContractFactory("MockERC721");
  const contract = await mockNftFactory.deploy();
  await contract.deployed();
  for (const holder of holders) {
    await contract.safeMint(holder.address);
  }
  return contract;
};

const getSignitureData = async (index, amount) => {
  const account = (await ethers.getSigners())[index];
  const message = utils.solidityPack(["address", "uint"], [account.address, amount]);
  const [owner] = await ethers.getSigners();
  const signed = await owner.signMessage(message);
  return { message: message, signed: signed, signer: account };
};

describe("LandDAO Claim to land owners", function () {
  it("Should set merkle root", async function () {
    const landDao = await deployLandDao();
    const amount = 1000;
    const signature = await getSignitureData(1, amount);
    const [owner] = await ethers.getSigners();
    await landDao.setSigner(owner.address);
    const signer = signature.signer;
    console.log(signature);
    await landDao.connect(signer).claimLandOwner(amount, signature.signed);
    const balance = await landDao.balanceOf(signer.address);
    expect(balance).to.equal(amount / 2);
    const result = landDao.connect(signer).claimLandOwner(amount, signature.signed);
    await expect(result).to.be.revertedWith("LandDAO: already claimed");

    const nextDate = 3600 * 24 * 100;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");

    await landDao.connect(signer).claimLandOwner(amount, signature.signed);
    const newBalance = await landDao.balanceOf(signer.address);
    expect(newBalance).to.equal(amount);

    const signatureOther = await getSignitureData(2, amount);
    const signerOther = signatureOther.signer;
    await landDao.connect(signerOther).claimLandOwner(amount, signatureOther.signed);
    const balanceOther = await landDao.balanceOf(signerOther.address);
    expect(balanceOther).to.equal(amount);

    const resultOther = landDao.connect(signerOther).claimLandOwner(amount, signatureOther.signed);
    await expect(resultOther).to.be.revertedWith("LandDAO: already claimed");
  });

  it("Should send not claimed tokens to treasury", async function () {
    const landDao = await deployLandDao();
    const [owner] = await ethers.getSigners();
    await expect(landDao.transferringUnclaimedTokens(owner.address)).to.be.reverted;
    const nextDate = 3600 * 24 * 181;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");

    const amount = 1000;
    const signature = await getSignitureData(1, amount);
    await landDao.setSigner(owner.address);
    const signer = signature.signer;
    const result = landDao.connect(signer).claimLandOwner(amount, signature.signed);
    await expect(result).to.be.revertedWith("LandDAO: date out of range");

    await landDao.transferringUnclaimedTokens(owner.address);
    const balance = await landDao.balanceOf(owner.address);
    expect(balance).to.equal(ethers.utils.parseEther("90000000"));
  });
});

describe("LandDAO Claim to nft owners", function () {
  it("Should claim tokens", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const nft = await deployNft([owner, addr1, addr2, addr1]);
    const landDao = await deployLandDao(nft.address);
    await landDao.connect(addr1).claimNftOwner([1, 3]);
    const balance = await landDao.balanceOf(addr1.address);
    expect(balance).to.equal(ethers.utils.parseEther("18000"));
  });

  it("Should not re-claim tokens", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const nft = await deployNft([owner, addr1, addr2, addr1]);
    const landDao = await deployLandDao(nft.address);
    await landDao.connect(addr1).claimNftOwner([1, 3]);
    const balance = await landDao.balanceOf(addr1.address);
    expect(balance).to.equal(ethers.utils.parseEther("18000"));
    const result = landDao.connect(addr1).claimNftOwner([1, 3])
    await expect(result).to.be.revertedWith(
      "LandDAO: tokens for NFT already claimed"
    );
  });

  it("Should not claim tokens if not owner", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const nft = await deployNft([owner, addr1, addr2, addr1]);
    const landDao = await deployLandDao(nft.address);
    const result = landDao.connect(addr2).claimNftOwner([1, 3]);
    await expect(result).to.be.revertedWith(
      "LandDAO: NFT belongs to different address"
    );
  });
});