const hre = require("hardhat");

async function main() {
  const LandLpStacking = await hre.ethers.getContractFactory("LPStaking");
  const landLpStacking = await LandLpStacking.deploy(
    "xTestDAO",
    "xTEST",
    "0x77cf6f9b71bb02857e8b341cee3130b4f7f996e0",
    "0x2cFd5F8E8C89c0bcEd8b71d2547da8a7f7cFE9b4",
  );
  await landLpStacking.deployed();
  console.log("LandDao staking deployed to:", landLpStacking.address);

  await hre.run("verify:verify", {
    address: landLpStacking.address,
    constructorArguments: [
      "xTestDAO",
      "xTEST",
      "0x77cf6f9b71bb02857e8b341cee3130b4f7f996e0",
      "0x2cFd5F8E8C89c0bcEd8b71d2547da8a7f7cFE9b4",
    ],
  });
  console.log("Source Verified");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
