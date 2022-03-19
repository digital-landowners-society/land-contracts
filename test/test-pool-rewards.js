const { expect } = require("chai");
const { ethers, network} = require("hardhat");
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

const getPoolRewards = async (landDao) => {
  const factory = await ethers.getContractFactory("PoolRewardsManager");
  const contract = await factory.deploy(landDao.address);
  await contract.deployed();
  await landDao.sendTokens("poolRewards", contract.address);
  return contract;
};

describe("Pool reward", function () {
  const maxSupply = BigNumber.from(10).pow(18).mul(340_000_000);
  const oneDayAmount = maxSupply.div(630);

  it("Should throw exception when treasury address not set", async function () {
    const landDao = await deployLandDao();
    const treasuryManager = await getPoolRewards(landDao);
    await expect(treasuryManager.distributePoolRewards(1)).to.be.revertedWith(
      "PoolRewardsManager: pool rewards wallet address not set"
    );
  });

  it("Should throw exception when treasury amount exceeds supply", async function () {
    const landDao = await deployLandDao();
    const contract = await getPoolRewards(landDao);
    const [owner] = await ethers.getSigners();
    await contract.setPoolRewardsWallet(owner.address);
    await expect(
      contract.distributePoolRewards(BigNumber.from(10).pow(27))
    ).to.be.revertedWith("PoolRewardsManager: amount more than releasable");
  });
  it("Should throw exception when Treasury amount more than releasable", async function () {
    const landDao = await deployLandDao();
    const contract = await getPoolRewards(landDao);
    const [owner] = await ethers.getSigners();
    await contract.setPoolRewardsWallet(owner.address);
    await expect(contract.distributePoolRewards(1)).to.be.revertedWith(
      "PoolRewardsManager: amount more than releasable"
    );
  });
  it("Should release", async function () {
    const landDao = await deployLandDao();
    const contract = await getPoolRewards(landDao);
    const [owner] = await ethers.getSigners();
    await contract.setPoolRewardsWallet(owner.address);
    const nextDate = 3600 * 24 * 100;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");
    await contract.distributePoolRewards(1);
    const balance = await landDao.balanceOf(owner.address);
    expect(balance).to.equal(1);
  });
  it("Should release max", async function () {
    const landDao = await deployLandDao();
    const contract = await getPoolRewards(landDao);
    const [owner] = await ethers.getSigners();
    await contract.setPoolRewardsWallet(owner.address);
    const nextDate = 3600 * 24 * 720;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");
    await contract.distributePoolRewards(maxSupply);
    const balance = await landDao.balanceOf(owner.address);
    expect(balance).to.equal(maxSupply);
  });
  it("Should not release more", async function () {
    const landDao = await deployLandDao();
    const contract = await getPoolRewards(landDao);
    const [owner] = await ethers.getSigners();
    await contract.setPoolRewardsWallet(owner.address);
    const nextDay = 3600 * 24;
    const nextDate = nextDay * 91;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");
    await contract.distributePoolRewards(oneDayAmount);
    const balance = await landDao.balanceOf(owner.address);
    expect(balance).to.equal(oneDayAmount);
    await expect(
      contract.distributePoolRewards(oneDayAmount)
    ).to.be.revertedWith("PoolRewardsManager: amount more than releasable");
    await network.provider.send("evm_increaseTime", [nextDay]);
    await network.provider.send("evm_mine");
    await contract.distributePoolRewards(oneDayAmount);
    const balance2 = await landDao.balanceOf(owner.address);
    expect(balance2).to.equal(oneDayAmount.mul(2));
    await expect(
      contract.distributePoolRewards(oneDayAmount)
    ).to.be.revertedWith("PoolRewardsManager: amount more than releasable");
  });
  it("Should freeze wallet address", async function () {
    const landDao = await deployLandDao();
    const contract = await getPoolRewards(landDao);
    const [owner, addr1] = await ethers.getSigners();
    await contract.setPoolRewardsWallet(addr1.address);
    await contract.freezePoolRewardsWallet();
    await expect(contract.setPoolRewardsWallet(owner.address)).to.be.revertedWith(
      "PoolRewardsManager: pool rewards wallet is frozen"
    );
  });
});