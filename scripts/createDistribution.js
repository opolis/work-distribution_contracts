// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { BigNumber, utils } = require("ethers");
const hre = require("hardhat");
const ethers = hre.ethers;
const config = require("../config.json");
const { MerkleTree } = require("../lib/merkleTree");
const fs = require("fs");

async function main() {
  // check stuff
  if (!config.privateKey) throw "No private key set";
  if (!config.merkleContractAddress) throw "No address for contract set";
  if (config.epoch < 0) throw "Epoch not set";

  // sample claims data
  const data = [
    {
      address: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
      claimBalance: "1111111111111",
    },
    {
      address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      claimBalance: "2222222222222",
    },
  ];

  // hash claims
  let total = ethers.BigNumber.from("0");
  const elements = data.map((entry) => {
    total = total.add(ethers.BigNumber.from(entry.claimBalance));
    return ethers.utils.solidityKeccak256(
      ["bytes", "uint"],
      [entry.address, BigNumber.from(entry.claimBalance)]
    );
  });
  console.log(`Distribution total is ${ethers.utils.formatEther(total)}`);

  //create merkle tree
  const merkleTree = new MerkleTree(elements);
  const root = merkleTree.getHexRoot();

  // create MerkleRedeem contract
  const MerkleRedeem = await ethers.getContractFactory("MerkleRedeem");
  const redeem = await MerkleRedeem.attach(config.merkleContractAddress);

  // upload merkle root
  console.log(`Sending proof...`);
  const seedTx = await redeem.seedAllocations(config.epoch, root, total);
  const seedReceipt = await seedTx.wait();
  console.log(`Seed tx mined, gas used ${seedReceipt.gasUsed.toString()}`);

  // output merkle proofs
  console.log(`Writing JSON file for epoch ${config.epoch}`);
  const jsonString = JSON.stringify(
    data.map((user, index) => {
      return {
        address: user.address,
        claimBalance: user.claimBalance,
        proof: merkleTree.getHexProof(elements[index]),
      };
    })
  );

  if (!fs.existsSync("./proofs")) fs.mkdirSync("./proofs");
  fs.writeFileSync(
    `./proofs/proof_epoch_${config.epoch}.json`,
    jsonString,
    (err) => {
      if (err) {
        console.log("Error writing file", err);
      } else {
        console.log("Successfully wrote file");
      }
    }
  );
  console.log(
    `Merkle proofs written to ./proofs/proof_epoch_${config.epoch}.json`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
