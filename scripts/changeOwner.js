/**
 * Changes owner on live MerkleRedeem contract
 */
const hre = require("hardhat");
const ethers = hre.ethers;
const config = require("../config.json");

// enter new owner address here
const NEW_OWNER_ADDRESS = ""

async function main() {
  // swap owner
  const signer = await ethers.getSigner();
  const redeem = new ethers.Contract(
    config.merkleContractAddress,
    [
      "function transferOwnership(address newOwner) public",
      "function owner() public view returns (address)"
    ],
    signer
  );

  console.log(`changing owner`);
  const approvalTx = await redeem.transferOwnership(
    NEW_OWNER_ADDRESS
  );
  const approvalReceipt = await approvalTx.wait();
  console.log(
    `Approval tx mined, gas used ${approvalReceipt.gasUsed.toString()}`
  );
  console.log("new owner:", await redeem.owner())
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
