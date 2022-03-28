const fs = require("fs");
const readline = require("readline");
const { ethers } = require("hardhat");

const generateSignature = async (address, amount, signer) => {
  const value = ethers.utils.solidityPack(["uint"], [address]);
  const message = ethers.utils.arrayify(value);
  const [owner] = await ethers.getSigners();
  return await owner.signMessage(message);
};

async function processLineByLine() {
  const f = fs.createReadStream("/home/soso/projects/dls/land-tools/backend/data/landowners/allowlist.csv");
  const o = "/home/soso/projects/dls/land-tools/backend/data/landowners/allowlist-signatures.csv";
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY);
  console.log(signer.address);
  const rl = readline.createInterface({input: f, crlfDelay: Infinity});
  let header = true;
  let counter = 0;
  for await (const line of rl) {
    if (header) {
      header = false;
      const newLine = "address,signature\n";
      fs.writeFile(o, newLine, { }, (err) => {});
      continue;
    }
    counter++;
    const data = line.split(",");
    const address = data[0];
    const signature = await generateSignature(address, signer);
    const newLine = address.toLowerCase() + "," + signature + "\n";
    fs.writeFile(o, newLine, { flag: "a+" }, (err) => {});
    console.log(counter);
  }
}

processLineByLine();