# Alchemy Gelato  NFT

## Summary

NFT powered by Open AI & Web3 functions:
- Each uer can mint 1 NFT
- A Web3 function is listening to every new mint and generate a new art using Stable Diffusion
- The NFT pic is published on IPFS and revealed on-chain via Gelato Automate


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

3. Test the Stable Diffusion NFT web3 function on Polygon Mumbai:
```
npx hardhat w3f-run stable-diffusion-nft --logs
```

## Deploy your smart contract and web3 function
```
yarn run deploy --network mumbai
```

## Verify
```
npx hardhat verify CONTRACT_ADDRESS DEDICATED_MSG_SENDER --network mumbai
```
```ts
npx hardhat node --network hardhat 
```

```ts
npx hardhat run  scripts/deploy-contract.ts
```
