import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("Signer address:", signer.address);
  let nonce = await signer.getTransactionCount();

  // Deploying NFT contract
  const nftFactory = await hre.ethers.getContractFactory("GelatoNft", signer);
  console.log("Deploying GelatoBotNft...");
  const gelatoBotNft = await nftFactory.deploy(
    "0xbb97656cd5fece3a643335d03c8919d5e7dcd225"
  );
  await gelatoBotNft.deployed();
  console.log("GelatoBotNft deployed to:", gelatoBotNft.address);

  console.log("Minting token...");

  // Trigger the mint function (assuming you want to mint with _isNight as true)
  const mintTx = await gelatoBotNft.mint(true);
  const receipt = await mintTx.wait();

  // Log the MintEvent from the receipt
  const mintEvent = receipt.events?.find((e: any) => e.event === "MintEvent");
  if (mintEvent) {
    console.log("Minted tokenId:", mintEvent.args?._tokenId.toString());
    console.log({
      blockNumber: mintEvent.blockNumber,
      blockHash: mintEvent.blockHash,
      transactionIndex: mintEvent.transactionIndex,
      removed: mintEvent.removed,
      address: mintEvent.address,
      data: mintEvent.data,
      topics: mintEvent.topics,
      transactionHash: mintEvent.transactionHash,
      logIndex: mintEvent.logIndex,
    });
  } else {
    console.log("MintEvent not found in transaction receipt.");
  }
}

// Error handling
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
