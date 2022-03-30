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

const deployLPStaking = async (landDao, lpMock) => {
  const factory = await ethers.getContractFactory("LPStaking");
  const contract = await factory.deploy(landDao.address, lpMock.address);
  await contract.deployed();
  return contract;
};

const deployMock = async (landDao) => {
  const factory = await ethers.getContractFactory("MockERC20");
  const contract = await factory.deploy();
  await contract.deployed();
  return contract;
};

describe("LPStaking stake", function () {
  it("Should be able to stake and un-stake", async function () {
    const [owner] = await ethers.getSigners();

    const landDao = await deployLandDao();
    const lpMock = await deployMock(landDao);
    await lpMock.mint(owner.address, ether);

    const lpStaking = await deployLPStaking(landDao, lpMock);
    await landDao.sendTokens("treasury", owner.address);
    await landDao.sendTokens("liquidityPoolRewards", lpStaking.address);

    const supply = await lpStaking.totalSupply();
    expect(supply).to.equal(0);

    const rewards = await landDao.balanceOf(lpStaking.address);
    expect(rewards).to.equal(ethers.utils.parseEther("70000000"));

    const balance = await landDao.balanceOf(owner.address);
    expect(balance).to.equal(ethers.utils.parseEther("100000000"));

    await lpMock.approve(lpStaking.address, ether);
    await lpStaking.stake(ether);

    const lpBalance = await lpMock.balanceOf(owner.address);
    expect(lpBalance).to.equal(0);
    const stakingBalance = await lpStaking.balanceOf(owner.address);
    expect(stakingBalance).to.equal(ether);
    expect(await lpStaking.totalSupply()).to.equal(ether);
    await network.provider.send("evm_mine");
    await lpStaking.withdraw(ether);
    const lastLpBalance = await lpMock.balanceOf(owner.address);
    expect(lastLpBalance).to.equal(ether);
    expect(await lpStaking.balanceOf(owner.address)).to.equal(0);
    expect(await lpStaking.totalSupply()).to.equal(0);
  });

  it("Should be able to distribute reward", async function () {
    const [owner] = await ethers.getSigners();

    const landDao = await deployLandDao();
    const lpMock = await deployMock(landDao);
    await lpMock.mint(owner.address, ether);

    const lpStaking = await deployLPStaking(landDao, lpMock);
    await landDao.sendTokens("treasury", owner.address);
    await landDao.sendTokens("liquidityPoolRewards", lpStaking.address);

    await lpMock.approve(lpStaking.address, ether);
    await lpStaking.stake(ether);

    expect(await lpStaking.balanceOf(owner.address)).to.equal(ether);
    expect(await lpMock.balanceOf(owner.address)).to.equal(0);
    expect(await lpStaking.totalSupply()).to.equal(ether);

    await lpStaking.getReward();
    expect(await landDao.balanceOf(owner.address)).to.equal(ether.mul("100000070"));
  });

  it("Should be able to exit", async function () {
    const [owner] = await ethers.getSigners();

    const landDao = await deployLandDao();
    const lpMock = await deployMock(landDao);
    await lpMock.mint(owner.address, ether);

    const lpStaking = await deployLPStaking(landDao, lpMock);
    await landDao.sendTokens("treasury", owner.address);
    await landDao.sendTokens("liquidityPoolRewards", lpStaking.address);

    await lpMock.approve(lpStaking.address, ether);
    await lpStaking.stake(ether);

    expect(await lpStaking.balanceOf(owner.address)).to.equal(ether);
    expect(await lpMock.balanceOf(owner.address)).to.equal(0);
    expect(await lpStaking.totalSupply()).to.equal(ether);

    await lpStaking.exit();
    expect(await landDao.balanceOf(owner.address)).to.equal(ether.mul("100000070"));
    const lastLpBalance = await lpMock.balanceOf(owner.address);
    expect(lastLpBalance).to.equal(ether);
  });

  it("Should be able to withdraw and exit", async function () {
    const [owner] = await ethers.getSigners();

    const landDao = await deployLandDao();
    const lpMock = await deployMock(landDao);
    await lpMock.mint(owner.address, ether);

    const lpStaking = await deployLPStaking(landDao, lpMock);
    await landDao.sendTokens("treasury", owner.address);
    await landDao.sendTokens("liquidityPoolRewards", lpStaking.address);

    await lpMock.approve(lpStaking.address, ether);
    await lpStaking.stake(ether);

    expect(await lpStaking.balanceOf(owner.address)).to.equal(ether);
    expect(await lpMock.balanceOf(owner.address)).to.equal(0);
    expect(await lpStaking.totalSupply()).to.equal(ether);

    await lpStaking.withdrawAndGetReward(ether);
    expect(await landDao.balanceOf(owner.address)).to.equal(ether.mul("100000070"));
    const lastLpBalance = await lpMock.balanceOf(owner.address);
    expect(lastLpBalance).to.equal(ether);
  });
});
