const {ethers, network} = require("hardhat");
const {expect} = require("chai");

const ether = ethers.utils.parseEther("1");

const deployLandDao = async () => {
  const landDaoFactory = await ethers.getContractFactory("LandDAO");
  const landDao = await landDaoFactory.deploy(
    "LandDAO",
    "LAND",
    "0x0000000000000000000000000000000000000000",
  );
  await landDao.deployed();
  return landDao;
};

const deploySubContract = async (landDao, lpMock, factoryName) => {
  const factory = await ethers.getContractFactory(factoryName);
  const contract = await factory.deploy(landDao.address, lpMock.address);
  await contract.deployed();
  return contract;
};

const deployMock = async (landDao, factoryName) => {
  const factory = await ethers.getContractFactory(factoryName);
  const contract = await factory.deploy();
  await contract.deployed();
  return contract;
};

describe("LandStacking stake", function () {
  it("Should be able to stake and un-stake", async function () {
    const landDao = await deployLandDao();
    const lpMock = await deployMock(landDao, "MockERC20");
    const [owner] = await ethers.getSigners();
    await lpMock.mint(owner.address, ether);

    const lpStaking = await deploySubContract(landDao, lpMock,"LPStaking");
    await landDao.sendTokens("treasury", owner.address);
    await landDao.sendTokens("singleStackingRewards", lpStaking.address);

    const supply = await lpStaking.totalSupply();
    expect(supply).to.equal(0);

    const rewards = await landDao.balanceOf(lpStaking.address);
    expect(rewards).to.equal(ethers.utils.parseEther("30000000"));

    const balance = await landDao.balanceOf(owner.address);
    expect(balance).to.equal(ethers.utils.parseEther("100000000"));

    await landDao.approve(lpStaking.address, ether);
    await lpStaking.stake(ether);

    const newBalance = await landDao.balanceOf(owner.address);
    expect(newBalance).to.equal(ethers.utils.parseEther("100000000").sub(ether));
    const stackingBalance = await lpStaking.balanceOf(owner.address);
    expect(stackingBalance).to.equal(ether);
    expect(await lpStaking.totalSupply()).to.equal(ether);
    await network.provider.send("evm_mine");
    await lpStaking.withdraw(ether);
    const lastBalance = await landDao.balanceOf(timeLock);
    expect(lastBalance).to.equal(ether);
    expect(await lpStaking.balanceOf(owner.address)).to.equal(0);
    expect(await lpStaking.totalSupply()).to.equal(0);
  });

  it("Should be able to distribute reward", async function () {
    const landDao = await deployLandDao();
    const lpMock = await deploySubContract(landDao, "MockERC20");
    const [owner] = await ethers.getSigners();
    await lpMock.mint(owner.address, ether);
    const lpStaking = await deploySubContract(landDao, lpMock,"LPStacking");

    await landDao.sendTokens("treasury", owner.address);
    await landDao.sendTokens("singleStackingRewards", lpStaking.address);

    await landDao.approve(lpStaking.address, ether);
    await lpStaking.stake(ether);
    expect(await lpStaking.balanceOf(owner.address)).to.equal(ether);
    expect(await landDao.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("99999999"));
    expect(await lpStaking.totalSupply()).to.equal(ether);

    await lpStaking.getReward();
    expect(await landDao.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("100000029"));

  });
});
