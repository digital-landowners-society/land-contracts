const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { BigNumber } = require("ethers");

const deployLandDao = async () => {
  const landDaoFactory = await ethers.getContractFactory("LandDAO");
  const landDao = await landDaoFactory.deploy(
    "LandDAO",
    "LAND",
    "0x0000000000000000000000000000000000000000"
  );
  await landDao.deployed();
  return landDao;
};

const getTreasury = async (landDao) => {
  const factory = await ethers.getContractFactory("TreasuryManager");
  const treasuryManager = await factory.deploy(landDao.address);
  await treasuryManager.deployed();
  await landDao.sendTokens("treasury", treasuryManager.address);
  return treasuryManager;
};

describe("LandDAO Distribute to Treasury", function () {
  it("Should throw exception when treasury address not set", async function () {
    const landDao = await deployLandDao();
    const treasuryManager = await getTreasury(landDao);
    await expect(treasuryManager.distributeTreasury(1)).to.be.revertedWith(
      "TreasuryManager: treasury address not set"
    );
  });

  it("Should throw exception when treasury amount exceeds supply", async function () {
    const landDao = await deployLandDao();
    const treasuryManager = await getTreasury(landDao);
    const [owner] = await ethers.getSigners();
    await treasuryManager.setTreasury(owner.address);
    await expect(
      treasuryManager.distributeTreasury(BigNumber.from(10).pow(27))
    ).to.be.revertedWith("TreasuryManager: amount more than releasable");
  });

  it("Should throw exception when Treasury amount more than releasable", async function () {
    const landDao = await deployLandDao();
    const treasuryManager = await getTreasury(landDao);
    const [owner] = await ethers.getSigners();
    await treasuryManager.setTreasury(owner.address);
    await expect(treasuryManager.distributeTreasury(1)).to.be.revertedWith(
      "TreasuryManager: amount more than releasable"
    );
  });

  it("Should release", async function () {
    const landDao = await deployLandDao();
    const treasuryManager = await getTreasury(landDao);
    const [owner] = await ethers.getSigners();
    await treasuryManager.setTreasury(owner.address);
    const nextDate = 3600 * 24 * 100;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");
    await treasuryManager.distributeTreasury(1);
    const balance = await landDao.balanceOf(owner.address);
    expect(balance).to.equal(1);
  });

  it("Should release max", async function () {
    const landDao = await deployLandDao();
    const treasuryManager = await getTreasury(landDao);
    const [owner] = await ethers.getSigners();
    await treasuryManager.setTreasury(owner.address);
    const nextDate = 3600 * 24 * 720;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");
    const maxSupply = BigNumber.from(10).pow(18).mul(100_000_000);
    await treasuryManager.distributeTreasury(maxSupply);
    const balance = await landDao.balanceOf(owner.address);
    expect(balance).to.equal(maxSupply);
  });

  it("Should not release more", async function () {
    const landDao = await deployLandDao();
    const treasuryManager = await getTreasury(landDao);
    const [owner] = await ethers.getSigners();
    await treasuryManager.setTreasury(owner.address);
    const nextDay = 3600 * 24;
    const nextDate = nextDay * 91;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");
    const oneDayAmount = BigNumber.from(10).pow(18).mul(158730);
    await treasuryManager.distributeTreasury(oneDayAmount);
    const balance = await landDao.balanceOf(owner.address);
    expect(balance).to.equal(oneDayAmount);
    await expect(
      treasuryManager.distributeTreasury(oneDayAmount)
    ).to.be.revertedWith("TreasuryManager: amount more than releasable");
    await network.provider.send("evm_increaseTime", [nextDay]);
    await network.provider.send("evm_mine");
    await treasuryManager.distributeTreasury(oneDayAmount);
    const balance2 = await landDao.balanceOf(owner.address);
    expect(balance2).to.equal(oneDayAmount.mul(2));
    await expect(
      treasuryManager.distributeTreasury(oneDayAmount)
    ).to.be.revertedWith("TreasuryManager: amount more than releasable");
  });

  it("Should release ETH", async function () {
    const landDao = await deployLandDao();
    const ether = ethers.utils.parseEther("1");
    const treasuryManager = await getTreasury(landDao);
    const [owner, addr1] = await ethers.getSigners();
    await treasuryManager.setTreasury(addr1.address);
    await owner.sendTransaction({ to: treasuryManager.address, value: ether });
    const balance = await treasuryManager.provider.getBalance(addr1.address);
    await treasuryManager.distributeTreasuryEthereum(ether);
    const newBalance = await treasuryManager.provider.getBalance(addr1.address);
    expect(newBalance).to.equal(balance.add(ether));
  });

  it("Should freeze wallet address", async function () {
    const landDao = await deployLandDao();
    const treasuryManager = await getTreasury(landDao);
    const [owner, addr1] = await ethers.getSigners();
    await treasuryManager.setTreasury(addr1.address);
    await treasuryManager.freezeTreasury();
    await expect(treasuryManager.setTreasury(owner.address)).to.be.revertedWith(
      "TreasuryManager: wallet address is mandatory"
    );
  });
});
