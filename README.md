# AVAX Summary Gelato Bots NFT

## Summary

NFT powered by Open AI & Web3 functions:
- Each uer can mint 1 NFT
- A Web3 function is listening to every new mint and generate a new art using Open Ai (Dall-E)
- The NFT pic is published on IPFS and revealed on-chain via Gelato Automate

## Demo
- Avalanche:
  - Mint website: https://avax-summit.web.app 
  - Smart Contract: https://snowtrace.io/address/0x5b91c8e7a2deabc623e6ab34e8c26f27cc18bc66
  - Web3 Function: https://beta.app.gelato.network/task/0xf73655ea3f8a96f5b2b472e5b6b735dee5f1db06ef5bb5177c1be09fe7522f43?chainId=43114
  - Open Sea NFTs: https://opensea.io/collection/avax-summit-gelato-bots

## How to run 

1. Install project dependencies:
```
yarn install
```

2. Create a `.env` file with your private config:
```
cp .env.example .env
```
You will need to create free accounts and get Api Keys from [OpenAI](https://platform.openai.com/) and [Nft.Storage](https://nft.storage/)

3. Test the Open AI NFT web3 function on Avalanche:
```
npx w3f test web3-functions/open-ai-nft/index.ts --show-logs --user-args=nftAddress:0x5B91C8E7a2DEABC623E6Ab34E8c26F27Cc18bC66
```

## Deploy your smart contract and web3 function
```
yarn run deploy --network goerli
```

## Verify
```
npx hardhat verify CONTRACT_ADDRESS DEDICATED_MSG_SENDER --network goerli
```
```ts
npx hardhat node --network hardhat 
```

```ts
npx hardhat run  scripts/deploy-contract.ts
```