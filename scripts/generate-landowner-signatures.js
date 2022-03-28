const fs = require("fs");
const readline = require("readline");
const { ethers } = require("hardhat");

const generateSignature = async (address, amount, signer) => {
  const tokens = ethers.utils.parseEther(amount.toString());
  const value = ethers.utils.solidityPack(["address", "uint96"], [address, tokens]);
  const message = ethers.utils.arrayify(value);
  const [owner] = await ethers.getSigners();
  return await owner.signMessage(message);
};

async function processLineByLine() {
  const f = fs.createReadStream("/home/soso/projects/dls/land-tools/backend/data/landowners/final.csv");
  const o = "/home/soso/projects/dls/land-tools/backend/data/landowners/landowner-signatures.csv";
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY);
  console.log(signer.address);
  const rl = readline.createInterface({input: f, crlfDelay: Infinity});
  let header = true;
  let counter = 0;
  let total = 0;
  for await (const line of rl) {
    if (header) {
      header = false;
      const newLine = line + ",signature\n";
      fs.writeFile(o, newLine, {  }, (err) => {});
      continue;
    }
    counter++;
    const data = line.split(",");
    const address = data[0];
    const amount = parseFloat(data[data.length - 1]);
    total += amount;
    const signature = await generateSignature(address, amount, signer);
    const newLine = line + "," + signature + "\n";
    fs.writeFile(o, newLine, { flag: "a+" }, (err) => {});
    if (counter % 100 === 0) console.log(counter);
  }
  console.log(total);
}

processLineByLine();