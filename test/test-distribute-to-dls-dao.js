const {expect} = require("chai");
const {ethers, network} = require("hardhat");
const {BigNumber} = require("ethers");

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

const getDlsDao = async (landDao) => {
  const dlsDaoManagerAddress = await landDao.dlsDaoManager();
  const DlsDaoManager = await ethers.getContractFactory("DlsDaoManager");
  return DlsDaoManager.attach(dlsDaoManagerAddress);
};

describe("LandDAO Distribute to DLS DAO", function () {
  it("Should throw exception when DLS DAO address not set", async function () {
    const landDao = await deployLandDao();
    const dlsDaoManager = await getDlsDao(landDao);
    await expect(dlsDaoManager.distributeToDlsDao(1)).to.be.revertedWith(
      "DLS DAO address not set"
    );
  });

  it("Should throw exception when DLS DAO amount exceeds supply", async function () {
    const landDao = await deployLandDao();
    const dlsDaoManager = await getDlsDao(landDao);
    const [owner] = await ethers.getSigners();
    await dlsDaoManager.setDlsDao(owner.address);
    await expect(
      dlsDaoManager.distributeToDlsDao(BigNumber.from(10).pow(27))
    ).to.be.revertedWith("Amount exceeds supply");
  });

  it("Should throw exception when DLS DAO amount more than releasable", async function () {
    const landDao = await deployLandDao();
    const dlsDaoManager = await getDlsDao(landDao);
    const [owner] = await ethers.getSigners();
    await dlsDaoManager.setDlsDao(owner.address);
    await expect(dlsDaoManager.distributeToDlsDao(1)).to.be.revertedWith(
      "Amount more than releasable"
    );
  });

  it("Should release", async function () {
    const landDao = await deployLandDao();
    const dlsDaoManager = await getDlsDao(landDao);
    const [owner] = await ethers.getSigners();
    await dlsDaoManager.setDlsDao(owner.address);
    const nextDate = 3600 * 24 * 100;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");
    await dlsDaoManager.distributeToDlsDao(1);
    const balance = await landDao.balanceOf(owner.address);
    expect(balance).to.equal(1);
  });

  it("Should release max", async function () {
    const landDao = await deployLandDao();
    const dlsDaoManager = await getDlsDao(landDao);
    const [owner] = await ethers.getSigners();
    await dlsDaoManager.setDlsDao(owner.address);
    const nextDate = 3600 * 24 * 720;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");
    const maxSupply = BigNumber.from(10).pow(18).mul(90_000_000);
    await dlsDaoManager.distributeToDlsDao(maxSupply);
    const balance = await landDao.balanceOf(owner.address);
    expect(balance).to.equal(maxSupply);
  });

  it("Should not release more", async function () {
    const landDao = await deployLandDao();
    const dlsDaoManager = await getDlsDao(landDao);
    const [owner] = await ethers.getSigners();
    await dlsDaoManager.setDlsDao(owner.address);
    const nextDay = 3600 * 24;
    const nextDate = nextDay * 91;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");
    const oneDayAmount = BigNumber.from(10).pow(18).mul(142857);
    await dlsDaoManager.distributeToDlsDao(oneDayAmount);
    const balance = await landDao.balanceOf(owner.address);
    expect(balance).to.equal(oneDayAmount);
    await expect(
      dlsDaoManager.distributeToDlsDao(oneDayAmount)
    ).to.be.revertedWith("Amount more than releasable");
    await network.provider.send("evm_increaseTime", [nextDay]);
    await network.provider.send("evm_mine");
    await dlsDaoManager.distributeToDlsDao(oneDayAmount);
    const balance2 = await landDao.balanceOf(owner.address);
    expect(balance2).to.equal(oneDayAmount.mul(2));
    await expect(
      dlsDaoManager.distributeToDlsDao(oneDayAmount)
    ).to.be.revertedWith("Amount more than releasable");
  });
});
