const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { BigNumber } = require("ethers");

const deployLandDao = async () => {
  const LandDao = await ethers.getContractFactory("LandDAO");
  const landDao = await LandDao.deploy(
    "LandDAO",
    "LAND",
    "0x3f33eea734b01ec9e9bd1b44a3eb80c36ba585be"
  );
  await landDao.deployed();
  return landDao;
};

const getPoolRewards = async (landDao) => {
  const poolRewardsManagerAddress = await landDao.poolRewardsManager();
  const poolRewardsManager = await ethers.getContractFactory(
    "PoolRewardsManager"
  );
  return poolRewardsManager.attach(poolRewardsManagerAddress);
};

describe("LandDAO Distribute to pool rewards", function () {
  it("Should throw exception when pool rewards wallet address not set", async function () {
    const landDao = await deployLandDao();
    const poolRewardsManager = await getPoolRewards(landDao);
    await expect(
      poolRewardsManager.distributePoolRewards(1)
    ).to.be.revertedWith("Pool rewards wallet address not set");
  });

  it("Should throw exception when pool rewards amount exceeds supply", async function () {
    const landDao = await deployLandDao();
    const poolRewardsManager = await getPoolRewards(landDao);
    const [owner] = await ethers.getSigners();
    await poolRewardsManager.setPoolRewardsWallet(owner.address);
    await expect(
      poolRewardsManager.distributePoolRewards(BigNumber.from(10).pow(27))
    ).to.be.revertedWith("Amount exceeds supply");
  });

  it("Should throw exception when pool rewards amount more than releasable", async function () {
    const landDao = await deployLandDao();
    const poolRewardsManager = await getPoolRewards(landDao);
    const [owner] = await ethers.getSigners();
    await poolRewardsManager.setPoolRewardsWallet(owner.address);
    await expect(
      poolRewardsManager.distributePoolRewards(1)
    ).to.be.revertedWith("Amount more than releasable");
  });

  it("Should release", async function () {
    const landDao = await deployLandDao();
    const poolRewardsManager = await getPoolRewards(landDao);
    const [owner] = await ethers.getSigners();
    await poolRewardsManager.setPoolRewardsWallet(owner.address);
    const nextDate = 3600 * 24 * 100;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");
    await poolRewardsManager.distributePoolRewards(1);
    const balance = await landDao.balanceOf(owner.address);
    expect(balance).to.equal(1);
  });

  it("Should release max", async function () {
    const landDao = await deployLandDao();
    const poolRewardsManager = await getPoolRewards(landDao);
    const [owner] = await ethers.getSigners();
    await poolRewardsManager.setPoolRewardsWallet(owner.address);
    const nextDate = 3600 * 24 * 720;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");
    const maxSupply = BigNumber.from(10).pow(18).mul(340_000_000);
    await poolRewardsManager.distributePoolRewards(maxSupply);
    const balance = await landDao.balanceOf(owner.address);
    expect(balance).to.equal(maxSupply);
  });

  it("Should not release more", async function () {
    const landDao = await deployLandDao();
    const poolRewardsManager = await getPoolRewards(landDao);
    const [owner] = await ethers.getSigners();
    await poolRewardsManager.setPoolRewardsWallet(owner.address);
    const nextDay = 3600 * 24;
    const nextDate = nextDay * 91;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");
    const oneDayAmount = BigNumber.from(10).pow(18).mul(539682);
    await poolRewardsManager.distributePoolRewards(oneDayAmount);
    const balance = await landDao.balanceOf(owner.address);
    expect(balance).to.equal(oneDayAmount);
    await expect(
      poolRewardsManager.distributePoolRewards(oneDayAmount)
    ).to.be.revertedWith("Amount more than releasable");
    await network.provider.send("evm_increaseTime", [nextDay]);
    await network.provider.send("evm_mine");
    await poolRewardsManager.distributePoolRewards(oneDayAmount);
    const balance2 = await landDao.balanceOf(owner.address);
    expect(balance2).to.equal(oneDayAmount.mul(2));
    await expect(
      poolRewardsManager.distributePoolRewards(oneDayAmount)
    ).to.be.revertedWith("Amount more than releasable");
  });
});
