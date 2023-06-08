import { ethers } from "hardhat";

async function main() {
  const Factory = await ethers.getContractFactory("GelatoBotNft");
  const gelatoBotNft = await Factory.deploy(
    "0xcc53666e25bf52c7c5bc1e8f6e1f6bf58e871659"
  );

  console.log("Contract deployed to:", gelatoBotNft.address);

  // Wait for the transaction to be mined
  await gelatoBotNft.deployTransaction.wait();

  console.log("Deployment transaction mined.");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
