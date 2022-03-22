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

const getProofs = async (index, amount, count=0) => {

  const accounts = await ethers.getSigners();
  console.log("Creating additional wallets");
  for (let i = 0; i < count; i++) {
    const newWallet = await ethers.Wallet.createRandom();
    accounts.push(newWallet);
  }
  console.log("Created leafs " + accounts.length.toString());
  const raw = accounts.map((x) => {
    return { address: x.address, amount: amount };
  });
  const data = raw.map((x) => {
    return utils.solidityPack(["address", "uint"], [x.address, x.amount]);
  });
  const tree = new MerkleTree(data, hash, {
    hashLeaves: true,
    sortPairs: true,
  });
  const root = tree.getHexRoot();
  const item = data[index];
  const leaf = hash(item);
  const proof = tree.getHexProof(leaf);
  console.log("Generated proof");
  return { root: root, proof: proof, signer: accounts[index] };
};

describe("LandDAO Claim to land owners", function () {
  it("Should set merkle root", async function () {
    const landDao = await deployLandDao();
    const amount = 1000;
    const proofData = await getProofs(1, amount);
    await landDao.setMerkleRoot(proofData.root);
    const signer = proofData.signer;
    await landDao.connect(signer).claimLandOwner(amount, proofData.proof);
    const balance = await landDao.balanceOf(signer.address);
    expect(balance).to.equal(amount / 2);
    const result = landDao.connect(signer).claimLandOwner(amount, proofData.proof);
    await expect(result).to.be.revertedWith("LandDAO: already claimed");

    const nextDate = 3600 * 24 * 100;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");

    await landDao.connect(signer).claimLandOwner(amount, proofData.proof);
    const newBalance = await landDao.balanceOf(signer.address);
    expect(newBalance).to.equal(amount);

    const proofDataOther = await getProofs(2, amount, 100);
    await landDao.setMerkleRoot(proofDataOther.root);
    const signerOther = proofDataOther.signer;
    await landDao.connect(signerOther).claimLandOwner(amount, proofDataOther.proof);
    const balanceOther = await landDao.balanceOf(signerOther.address);
    expect(balanceOther).to.equal(amount);

    const resultOther = landDao.connect(signerOther).claimLandOwner(amount, proofDataOther.proof);
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
    const proofData = await getProofs(1, amount, 100);
    await landDao.setMerkleRoot(proofData.root);
    const signer = proofData.signer;
    const result = landDao.connect(signer).claimLandOwner(amount, proofData.proof);
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
    const result = landDao.connect(addr1).claimNftOwner([1, 3]);
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