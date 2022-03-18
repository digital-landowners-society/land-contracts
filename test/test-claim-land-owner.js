const { ethers } = require("hardhat");
const utils = ethers.utils;
const { MerkleTree } = require("merkletreejs");
const hash = require("keccak256");

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

const getProofs = async (index, amount) => {
  const accounts = await ethers.getSigners();
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
  return { root: root, proof: proof, signer: accounts[index] };
};


describe("LandDAO Claim to land owners", function () {
  it("Should set merkle root", async function () {
    const landDao = await deployLandDao();
    const amount = 1000;
    const proofData = await getProofs(1, amount);
    await landDao.setMerkleRoot(proofData.root);
    await landDao.connect(proofData.signer).claimLandOwner(
      amount,
      proofData.proof);
  });
});
