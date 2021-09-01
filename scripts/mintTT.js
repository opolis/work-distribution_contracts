/**
 * Mints Test Tokens to Merkle Contract
 */
 const hre = require("hardhat");
 const ethers = hre.ethers;
 const config = require("../config.json");
 
 // amount to mint
 const AMOUNT = "1000000000000000000000"
 
 async function main() { 
  const signer = await ethers.getSigner();
   const workToken = new ethers.Contract(
     config.workTokenAddress,
     [
       "function mint(address account, uint256 amount) public",
     ],
     signer
   );
 
   console.log(`Minting Test tokens to Merkle contract`);
   const mintTx = await workToken.mint(
     config.merkleContractAddress,
     AMOUNT
   );
   const mintReceipt = await mintTx.wait();
   console.log(
     `Mint tx mined, gas used ${mintReceipt.gasUsed.toString()}`
   );
 }
 
 main()
   .then(() => process.exit(0))
   .catch((error) => {
     console.error(error);
     process.exit(1);
   });
 