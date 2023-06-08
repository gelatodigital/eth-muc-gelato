/* eslint-disable @typescript-eslint/naming-convention */
import { Web3Function, Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk";
import { Contract, utils } from "ethers";
import { NFTStorage, File } from "nft.storage";
import axios, { AxiosError } from "axios";

const NFT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "function revealNft(uint256 tokenId, string memory tokenURI) external",
  "function tokenURI(uint256 tokenId) public view returns (string memory) ",
  "function tokenIds() public view returns(uint256)",
  "function tokenIdByUser(address) public view returns(uint256)",
  "function nightTimeByToken(uint256) public view returns(bool)",
  "function mint(bool _isNight) external",
  "event MintEvent(uint256 _tokenId)",
];
const PROXY_ABI = ["function batchExecuteCall(address[] _targets, bytes[] _datas, uint256[] _values) payable"];
const NOT_REVEALED_URI = "ipfs://bafyreicwi7sbomz7lu5jozgeghclhptilbvvltpxt3hbpyazz5zxvqh62m/metadata.json";

function generateNftProperties(isNight: boolean) {
  const timeSelected = isNight ? "at night" : "at sunset";

  const description = `A cute robot eating an icecream with Barcelona background ${timeSelected} in a cyberpunk art, 3D, video game, and pastel salmon colors`;
  return {
    description,
    attributes: [
      { trait_type: "Time", value: timeSelected },
      { trait_type: "Place", value: "AVAX Summit Barcelona" },
      { trait_type: "Eating", value: "Gelato" },
      { trait_type: "Powered", value: "Web 3 Functions" },
    ],
  };
}

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, multiChainProvider, secrets, storage } = context;
  const provider = multiChainProvider.default();
  ////// User Arguments
  const nftAddress = userArgs.nftAddress as string;
  console.log("nftAddress", nftAddress);

  if (!nftAddress) throw new Error("Missing userArgs.nftAddress please provide");

  ////// User Secrets
  const nftStorageApiKey = await secrets.get("NFT_STORAGE_API_KEY");
  const stableDiffusionApiKey = await secrets.get("STABLE_DIFFUSION_API_KEY");

  if (!nftStorageApiKey || !stableDiffusionApiKey) {
    console.error("Error: Missing secrets");
    return {
      canExec: false,
      message: "Error: Missing Secrets",
    };
  }

  // Retreive current state
  const nft = new Contract(nftAddress as string, NFT_ABI, provider);
  const lastProcessedId = parseInt((await storage.get("lastProcessedId")) ?? "0");
  const currentTokenId = (await nft.tokenIds()).toNumber();
  if (currentTokenId === lastProcessedId) {
    return { canExec: false, message: "No New Tokens" };
  }

  // Get batch of next token ids to process in parallel
  const tokenIds: number[] = [];
  let tokenId = lastProcessedId;
  let nbRpcCalls = 0;
  const MAX_RPC_CALLS = 30;
  const MAX_NFT_IN_BATCH = 5;
  while (tokenId < currentTokenId && tokenIds.length < MAX_NFT_IN_BATCH && nbRpcCalls < MAX_RPC_CALLS) {
    // Check if token needs to be revealed or is already revealed
    tokenId++;
    const tokenURI = await nft.tokenURI(tokenId);
    if (tokenURI === NOT_REVEALED_URI) {
      tokenIds.push(tokenId);
    } else {
      console.log(`#${tokenId} already revealed!`);
    }
    nbRpcCalls++;
  }

  if (tokenIds.length === 0) {
    console.log(`All NFTs already revealed!`);
    await storage.set("lastProcessedId", tokenId.toString());
    return { canExec: false, message: "All NFTs already revealed" };
  }

  console.log("NFTs to reveal:", tokenIds);
  const tokensData = await Promise.all(
    tokenIds.map(async (tokenId) => {
      // Generate NFT properties
      const isNight = await nft.nightTimeByToken(tokenId);
      const nftProps = generateNftProperties(isNight);
      console.log(`#${tokenId} Open AI prompt: ${nftProps.description}`);

      // Generate NFT image with OpenAI (Dall-E)
      let imageUrl: string;
      try {
        const stableDiffusionResponse = await fetch("https://stablediffusionapi.com/api/v3/text2img", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: stableDiffusionApiKey,
            prompt: nftProps.description,
            negative_prompt: null,
            width: "512",
            height: "512",
            samples: "1",
            num_inference_steps: "20",
            seed: null,
            guidance_scale: 7.5,
            safety_checker: "yes",
            multi_lingual: "no",
            panorama: "no",
            self_attention: "no",
            upscale: "no",
            embeddings_model: "embeddings_model_id",
            webhook: null,
            track_id: null,
          }),
        });
        const stableDiffusionData = await stableDiffusionResponse.json();
        console.log(stableDiffusionData.output[0]);
        imageUrl = stableDiffusionData.output[0] as string;
        console.log(`Stable Diffusion generated image: ${imageUrl}`);
      } catch (_err) {
        const stableDiffusionError = _err as AxiosError;
        if (stableDiffusionError.response) {
          const errorMessage = stableDiffusionError.response?.status
            ? `${stableDiffusionError.response.status}: ${stableDiffusionError.response.data}`
            : stableDiffusionError.message;
          return { canExec: false, message: `OpenAI error: ${errorMessage}` };
        }
      }

      // Publish NFT metadata on IPFS
      const imageBlob = (await axios.get(imageUrl, { responseType: "blob" })).data;
      const nftStorage = new NFTStorage({ token: nftStorageApiKey });

      const imageFile = new File([imageBlob], `gelato_bot_${tokenId}.png`, { type: "image/png" });
      const metadata = await nftStorage.store({
        name: `AVAX Summit GelatoBot #${tokenId}`,
        description: nftProps.description,
        image: imageFile,
        attributes: nftProps.attributes,
        collection: { name: "AVAX-Summit-GelatoBots", family: "avaxsummit-gelatobots" },
      });
      console.log(`#${tokenId} IPFS Metadata ${metadata.url}`);

      return { id: tokenId, url: metadata.url };
    })
  );

  await storage.set("lastProcessedId", tokenId.toString());

  // Use Automate Proxy `batchExecuteCall` to send multiple requests in batch
  const proxyInterface = new utils.Interface(PROXY_ABI);
  const addresses: string[] = [];
  const calls: string[] = [];
  const values: number[] = [];
  tokensData.forEach((token) => {
    addresses.push(nft.address);
    calls.push(nft.interface.encodeFunctionData("revealNft", [token.id, token.url]));
    values.push(0);
  });
  return {
    canExec: true,
    callData: proxyInterface.encodeFunctionData("batchExecuteCall", [addresses, calls, values]),
  };
});
