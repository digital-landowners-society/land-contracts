const hre = require("hardhat");

async function main() {
  const LandStacking = await hre.ethers.getContractFactory("LandStacking");
  const landStacking = await LandStacking.deploy(
    "vTestDAO",
    "vTEST",
    "0x2cFd5F8E8C89c0bcEd8b71d2547da8a7f7cFE9b4"
  );
  await landStacking.deployed();
  console.log("LandDao staking deployed to:", landStacking.address);

  await hre.run("verify:verify", {
    address: landStacking.address,
    constructorArguments: [
      "vTestDAO",
      "vTEST",
      "0x2cFd5F8E8C89c0bcEd8b71d2547da8a7f7cFE9b4",
    ],
  });
  console.log("Source Verified");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
