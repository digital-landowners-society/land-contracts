const hre = require("hardhat");

function sleep(s) {
  return new Promise(resolve => setTimeout(resolve, s*1000));
}

async function main() {
  const LandDao = await hre.ethers.getContractFactory("LandDAO");
  const landDao = await LandDao.deploy(
    "LAND Token",
    "LAND",
    "0x3f33eea734b01ec9e9bd1b44a3eb80c36ba585be" // DLS NFT
  );
  await landDao.deployed();
  console.log("LandDao deployed to:", landDao.address);

  await sleep(10);

  await hre.run("verify:verify", {
    address: landDao.address,
    constructorArguments: [
      "LAND Token",
      "LAND",
      "0x3f33eea734b01ec9e9bd1b44a3eb80c36ba585be", // DLS NFT
    ],
  });
  console.log("Source Verified");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
