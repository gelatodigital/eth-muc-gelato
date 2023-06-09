import { ethers } from "hardhat";

async function main() {
  const Factory = await ethers.getContractFactory("GelatoNft");
  //Replace with your dedicated msg.sender
  const gelatoNft = await Factory.deploy(
    "0x2e4d6bec6cd616f71274fae0fbfaceb5188b55c2"
  );

  console.log("Contract deployed to:", gelatoNft.address);

  // Wait for the transaction to be mined
  await gelatoNft.deployTransaction.wait();

  console.log("Deployment transaction mined.");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
