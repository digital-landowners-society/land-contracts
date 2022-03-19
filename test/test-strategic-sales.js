const { ethers, network} = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const {expect} = require("chai");

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

const deployStrateicSales = async (landDao) => {
  const factory = await ethers.getContractFactory("StrategicSalesManager");
  const contract = await factory.deploy(landDao.address);
  await contract.deployed();
  await landDao.sendTokens("strategicSale", contract.address);
  return contract;
};

const ether = ethers.utils.parseEther("1");
describe("Strategic sales release", function () {
  it("Should do direct release", async function () {
    const landDao = await deployLandDao();
    const contract = await deployStrateicSales(landDao);
    const [owner, addr1] = await ethers.getSigners();
    await contract.saleDirect(addr1.address, ether);
    const balance = await landDao.balanceOf(addr1.address);
    expect(balance).to.equal(ether);
  });

  it("Should do vested release", async function () {
    const landDao = await deployLandDao();
    const contract = await deployStrateicSales(landDao);
    const [owner, addr1, addr2] = await ethers.getSigners();
    await contract.saleVesting(addr1.address, 1000, 0, 1000);
    await contract.saleReleaseOwner(addr1.address);
    const balance = await landDao.balanceOf(addr1.address);
    expect(balance).to.equal(1);

    await network.provider.send("evm_increaseTime", [99]);
    await network.provider.send("evm_mine");

    await contract.saleReleaseOwner(addr1.address);
    const newBalance = await landDao.balanceOf(addr1.address);
    expect(newBalance).to.equal(101);

    await network.provider.send("evm_increaseTime", [999]);
    await network.provider.send("evm_mine");

    await contract.saleReleaseOwner(addr1.address);
    const lastBalance = await landDao.balanceOf(addr1.address);
    expect(lastBalance).to.equal(1000);

    await contract.saleVesting(addr2.address, 500, 1, 500);
    await contract.saleVesting(addr2.address, 1000, 0, 1000);
    await network.provider.send("evm_increaseTime", [500]);
    await contract.connect(addr2).saleRelease();
    const otherBalance = await landDao.balanceOf(addr2.address);
    expect(otherBalance).to.equal(1000);
  });
});

describe("Strategic sales deployment", function () {
  it("Should deploy and send tokens", async function () {
    const landDao = await deployLandDao();
    const contract = await deployStrateicSales(landDao);
    const balance = await landDao.balanceOf(contract.address);
    expect(balance).to.equal(ethers.utils.parseEther("50000000"));
  });

  it("Should invest and withdraw", async function () {
    const landDao = await deployLandDao();
    const contract = await deployStrateicSales(landDao);
    const [owner, addr1] = await ethers.getSigners();
    await owner.sendTransaction({
      value: ether,
      to: contract.address,
    });
    const balance = await addr1.getBalance();
    await contract.investmentWithdraw(addr1.address, ether);
    const newBalance = await addr1.getBalance();
    expect(newBalance).to.equal(balance.add(ether));
  });
});