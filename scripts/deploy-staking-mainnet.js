const hre = require("hardhat");

function sleep(s) {
  return new Promise(resolve => setTimeout(resolve, s*1000));
}

async function main() {
  const LandStaking = await hre.ethers.getContractFactory("LandStaking");
  const landStaking = await LandStaking.deploy(
    "0x54aa569005332e4d6f91e27c55307aaef607c0e2", // LandDAO
    "0x52666aDcfbfbd8e1Bd469c13de6aBcc4cce27069", // vLandDAO
  );
  await landStaking.deployed();
  console.log("LandDao staking deployed to:", landStaking.address);

  await sleep(10);

  await hre.run("verify:verify", {
    address: landStaking.address,
    constructorArguments: [
      "0x54aa569005332e4d6f91e27c55307aaef607c0e2", // LandDAO
      "0x52666aDcfbfbd8e1Bd469c13de6aBcc4cce27069", // vLandDAO
    ],
  });
  console.log("Source Verified");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
