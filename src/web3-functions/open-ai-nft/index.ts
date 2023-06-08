/* eslint-disable @typescript-eslint/naming-convention */
import { Web3Function, Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk";
import { Contract, BigNumber } from "ethers";
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
const NOT_REVEALED_URI = "ipfs://bafyreicwi7sbomz7lu5jozgeghclhptilbvvltpxt3hbpyazz5zxvqh62m/metadata.json";

function generateNftProperties(isNight: boolean) {
  const timeSelected = isNight ? "at night" : "at sunset";

  const description = `A cute robot eating an icecream with Barcelona background ${timeSelected} in a cyberpunk art, 3D, video game, and pastel salmon colors`;
  return {
    description,
    attributes: [
      { trait_type: "Time", value: timeSelected },
      { trait_type: "Place", value: "Barcelona" },
      { trait_type: "Eating", value: "Gelato" },
      { trait_type: "Powered", value: "Web 3 Functions" },
    ],
  };
}

Web3Function.onRun(async (context: Web3FunctionContext) => {
  console.log("kkkkk");
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
  ////// User Storage
  const lastProcessedId = parseInt((await storage.get("lastProcessedId")) ?? "0");

  const nft = new Contract(nftAddress as string, NFT_ABI, provider);
  console.log(nft);
  const currentTokenId = await nft.tokenIds();
  if (currentTokenId.eq(BigNumber.from(lastProcessedId))) {
    return { canExec: false, message: "No New Tokens" };
  }

  const tokenId = lastProcessedId + 1;
  const tokenURI = await nft.tokenURI(tokenId);
  if (tokenURI == NOT_REVEALED_URI) {
    // Generate NFT properties
    const isNight = await nft.nightTimeByToken(tokenId);
    const nftProps = generateNftProperties(isNight);
    console.log(`Open AI prompt: ${nftProps.description}`);

    // Generate NFT image with OpenAI (Dall-E)

    // const openai = new OpenAIApi(new Configuration({ apiKey: "stableDiffusionApiKey" }));
    console.log("resphonse");
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

    const client = new NFTStorage({ token: nftStorageApiKey });
    const imageFile = new File([imageBlob], `gelato_bot_${tokenId}.png`, { type: "image/png" });

    const metadata = await client.store({
      name: `AVAX Summit GelatoBot #${tokenId}`,
      description: nftProps.description,
      image: imageFile,
      attributes: nftProps.attributes,
      collection: { name: "AVAXSummit-GelatoBots", family: "avaxsummit-gelatobots" },
    });
    console.log("hello");
    console.log("IPFS Metadata:", metadata.url);

    await storage.set("lastProcessedId", tokenId.toString());

    return {
      canExec: true,
      callData: nft.interface.encodeFunctionData("revealNft", [tokenId, metadata.url]),
    };
  } else {
    console.log(`#${tokenId} already minted!`);
    await storage.set("lastProcessedId", tokenId.toString());
    return { canExec: false, message: "Token already Minted" };
  }
});
