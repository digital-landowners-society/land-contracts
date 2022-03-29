const { ethers, network} = require("hardhat");
const utils = ethers.utils;
const { expect } = require("chai");

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

const getSignatureData = async (index, amount) => {
  const account = (await ethers.getSigners())[index];
  const finalValue = utils.solidityPack(["address", "uint96"], [account.address, amount]);
  const message = ethers.utils.arrayify(finalValue);
  const [owner] = await ethers.getSigners();
  const signed = await owner.signMessage(message);
  return { message: message, signed: signed, signer: account };
};

const getWhitelistData = async (index) => {
  const account = (await ethers.getSigners())[index];
  const finalValue = utils.solidityPack(["uint"], [account.address]);
  const message = ethers.utils.arrayify(finalValue);
  const [owner] = await ethers.getSigners();
  const signed = await owner.signMessage(message);
  return { message: message, signed: signed, signer: account };
};

describe("LandDAO Claim whitelist", function () {
  it("Should not be unable to claim if not open", async function () {
    const landDao = await deployLandDao();
    const amount = utils.parseEther("100000");
    const signature = await getSignatureData(1, amount);
    const signer = signature.signer;
    const result = landDao.connect(signer).claim(amount, signature.signed, [], []);
    await expect(result).to.be.revertedWith("LandDao: you can not claim yet");
  });

  it("Should not be unable to claim if not whitelisted", async function () {
    const landDao = await deployLandDao();
    await landDao.setAllowlistEnabled(true);
    const amount = utils.parseEther("100000");
    const signature = await getSignatureData(1, amount);
    const signer = signature.signer;
    const result = landDao.connect(signer).claim(amount, signature.signed, [], []);
    await expect(result).to.be.revertedWith(
      "LandDao: you can not claim yet unless you provide allowlist data"
    );
  });

  it("Should be unable to claim if whitelisted", async function () {
    const landDao = await deployLandDao();
    await landDao.setAllowlistEnabled(true);
    const amount = utils.parseEther("100000");
    const signature = await getSignatureData(1, amount);
    const whitelist = await getWhitelistData(1);
    const signer = signature.signer;
    await landDao.connect(signer).claim(amount, signature.signed, whitelist.signed, []);
  });
});

describe("LandDAO Claim to land owners", function () {
  it("Should be enabled to claim as a land owner", async function () {
    const landDao = await deployLandDao();
    await landDao.setClaimEnabled(true);
    const amount = utils.parseEther("100000");
    const signature = await getSignatureData(1, amount);
    const signer = signature.signer;
    await landDao.connect(signer).claim(amount, signature.signed, [], []);
    const balance = await landDao.balanceOf(signer.address);
    expect(balance).to.equal(amount.div(2));
    const result = landDao.connect(signer).claim(amount, signature.signed, [], []);
    await expect(result).to.be.revertedWith("LandDAO: already claimed");

    const nextDate = 3600 * 24 * 100;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");

    await landDao.connect(signer).claim(amount, signature.signed, [], []);
    const newBalance = await landDao.balanceOf(signer.address);
    expect(newBalance).to.equal(amount);

    const signatureOther = await getSignatureData(2, amount);
    const signerOther = signatureOther.signer;
    await landDao.connect(signerOther).claim(amount, signatureOther.signed, [], []);
    const balanceOther = await landDao.balanceOf(signerOther.address);
    expect(balanceOther).to.equal(amount);

    const resultOther = landDao.connect(signerOther).claim(amount, signatureOther.signed, [], []);
    await expect(resultOther).to.be.revertedWith("LandDAO: already claimed");
  });

  it("Should send not claimed tokens to treasury", async function () {
    const landDao = await deployLandDao();
    await landDao.setClaimEnabled(true);
    const [owner] = await ethers.getSigners();
    await expect(landDao.transferringUnclaimedTokens(owner.address)).to.be.reverted;
    const nextDate = 3600 * 24 * 181;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");

    const amount = 1000;
    const signature = await getSignatureData(1, amount);
    const signer = signature.signer;
    const result = landDao.connect(signer).claim(amount, signature.signed, [], []);
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
    await landDao.setClaimEnabled(true);
    await landDao.connect(addr1).claim(0, [], [], [1, 3]);
    const balance = await landDao.balanceOf(addr1.address);
    expect(balance).to.equal(ethers.utils.parseEther("18000"));
  });

  it("Should not re-claim tokens", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const nft = await deployNft([owner, addr1, addr2, addr1]);
    const landDao = await deployLandDao(nft.address);
    await landDao.setClaimEnabled(true);
    await landDao.connect(addr1).claim(0, [], [], [1, 3]);
    const balance = await landDao.balanceOf(addr1.address);
    expect(balance).to.equal(ethers.utils.parseEther("18000"));
    const result = landDao.connect(addr1).claim(0, [], [], [1, 3]);
    await expect(result).to.be.revertedWith(
      "LandDAO: tokens for NFT already claimed"
    );
  });

  it("Should not claim tokens if not owner", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const nft = await deployNft([owner, addr1, addr2, addr1]);
    const landDao = await deployLandDao(nft.address);
    await landDao.setClaimEnabled(true);
    const result = landDao.connect(addr2).claim(0, [], [], [1, 3]);
    await expect(result).to.be.revertedWith(
      "LandDAO: NFT belongs to different address"
    );
  });
});

