const hre = require("hardhat");

async function main() {
  const LandLpStaking = await hre.ethers.getContractFactory("LPStaking");
  const landLpStaking = await LandLpStaking.deploy(
    "0x54aa569005332e4d6f91e27c55307aaef607c0e2", // LandDAO
    "0xd6be39d1166f57d2425fe655cca85ca4af15ef9d", // LP
  );
  await landLpStaking.deployed();
  console.log("LandDao staking deployed to:", landLpStaking.address);

  await hre.run("verify:verify", {
    address: landLpStaking.address,
    constructorArguments: [
      "0x54aa569005332e4d6f91e27c55307aaef607c0e2", // LandDAO
      "0xd6be39d1166f57d2425fe655cca85ca4af15ef9d", // LP
    ],
  });
  console.log("Source Verified");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
