/* eslint-disable @typescript-eslint/naming-convention */
import hre from "hardhat";
import { GelatoOpsSDK, isGelatoOpsSupported, TaskTransaction, Web3Function } from "@gelatonetwork/ops-sdk";

async function main() {
  const chainId = hre.network.config.chainId as number;


  // Init GelatoOpsSDK
  const [signer] = await hre.ethers.getSigners();

  console.log(signer.address)


  const gelatoOps = new GelatoOpsSDK(80001, signer);
   const dedicatedMsgSender = await gelatoOps.getDedicatedMsgSender();
   console.log(`Dedicated msg.sender: ${dedicatedMsgSender.address} is deployed ${dedicatedMsgSender.isDeployed}`);

   let nonce = await signer.getTransactionCount();

  // Deploying NFT contract
  const nftFactory = await hre.ethers.getContractFactory("AVAXSummitGelatoBotNft",signer);
  console.log("Deploying GelatoBotNft...");
  const gelatoBotNft = await nftFactory.deploy(dedicatedMsgSender.address,{  
    nonce:0});
  await gelatoBotNft.deployed();


  console.log(`GelatoBotNft deployed to: ${gelatoBotNft.address}`);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
