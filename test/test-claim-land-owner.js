const { ethers } = require("hardhat");
const utils = ethers.utils;
const { MerkleTree } = require("merkletreejs");
const hash = require("keccak256");

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

const getLandOwnerManager = async (landDao) => {
  const landOwnerManagerAddress = await landDao.landOwnerManager();
  const landOwnerManager = await ethers.getContractFactory(
    "LandOwnerManager"
  );
  return landOwnerManager.attach(landOwnerManagerAddress);
};

describe("LandDAO Claim to land owners", function () {
  it("Should set merkle root", async function () {
    const landDao = await deployLandDao();
    const landOwnerManager = await getLandOwnerManager(landDao);
    const amount = 1000;
    const proofData = await getProofs(1, amount);
    await landOwnerManager.setMerkleRoot(proofData.root);
    await landOwnerManager
      .connect(proofData.signer)
      .claimLandOwner(amount, proofData.proof);
  });
});
