import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {

  const [signer] = await hre.ethers.getSigners();
  console.log(signer.address)
  let nonce = await signer.getTransactionCount();

// Deploying NFT contract
const nftFactory = await hre.ethers.getContractFactory("GelatoNft",signer);
console.log("Deploying GelatoBotNft...");
const gelatoBotNft = await nftFactory.deploy("0xbb97656cd5fece3a643335d03c8919d5e7dcd225");
await gelatoBotNft.deployed();



}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
