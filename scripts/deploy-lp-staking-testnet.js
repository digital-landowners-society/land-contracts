const hre = require("hardhat");

async function main() {
  const LandLpStaking = await hre.ethers.getContractFactory("LPStaking");
  const landLpStaking = await LandLpStaking.deploy(
    "0x9792C97C6EC5361289BE9392E601a58222b18f66", // LandDAO
    "0x783651a701678f1C18416D5DbA6cF34aC5fEa242", // LP
  );
  await landLpStaking.deployed();
  console.log("LandDao staking deployed to:", landLpStaking.address);

  await hre.run("verify:verify", {
    address: landLpStaking.address,
    constructorArguments: [
      "0x9792C97C6EC5361289BE9392E601a58222b18f66", // LandDAO
      "0x783651a701678f1C18416D5DbA6cF34aC5fEa242", // LP
    ],
  });
  console.log("Source Verified");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
