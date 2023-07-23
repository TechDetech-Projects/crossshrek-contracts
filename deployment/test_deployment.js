const { ethers } = require("ethers");
const dotenv = require("dotenv");

dotenv.config();


const deployAdresses = require('./deployAdresses.json')
const CSatelliteJSON = require("../artifacts/contracts/crosschain/CSatellite.sol/CSatellite.json");


const ExampleERC20TokenJSON = require("../artifacts/contracts/test_templates/ExampleERC20Token.sol/ERC20.json");

const CCrosschainErc20JSON = require("../artifacts/contracts/crosschain/CCrosschainErc20.sol/CCrosschainErc20.json");



const MNEMONIC = process.env.MNEMONIC;
const polygonProviderUrl = "http://localhost:8500/4";
const polygonProvider = new ethers.providers.JsonRpcProvider(
    polygonProviderUrl
);
const polygonWallet = new ethers.Wallet.fromMnemonic(MNEMONIC).connect(
    polygonProvider
);


const moonbeamProviderUrl = "http://localhost:8500/0";
const moonbeamProvider = new ethers.providers.JsonRpcProvider(
    moonbeamProviderUrl
);
const moonbeamWallet = new ethers.Wallet.fromMnemonic(MNEMONIC).connect(
    moonbeamProvider
);


async function testMinting() {
    const CSatelliteContract = new ethers.Contract(
        deployAdresses.polygon.CSatellite,
        CSatelliteJSON.abi,
        polygonWallet
      );
    
      const ExampleERC20TokenContract = new ethers.Contract(
        deployAdresses.polygon.ExampleERC20Token,
        ExampleERC20TokenJSON.abi,
        polygonWallet
      );

      const CCrosschainErc20Contract = new ethers.Contract(
        deployAdresses.moonbeam.CCrosschainErc20,
        CCrosschainErc20JSON.abi,
        moonbeamWallet
      );
    
    
    const ERC20MintAmount = BigInt(1e2);
    await ExampleERC20TokenContract.approve(deployAdresses.polygon.CSatellite,ERC20MintAmount)
    await CSatelliteContract.mint(ERC20MintAmount,{ gasLimit: BigInt(1e6),value:BigInt(1e8)});
    await new Promise(r => setTimeout(r, 4000));

    const result2 = await ExampleERC20TokenContract.balanceOf(await polygonWallet.getAddress())
    const result = await CCrosschainErc20Contract.balanceOf(await polygonWallet.getAddress())

    console.log("Balance of",await polygonWallet.getAddress(),": ",Number(result)
    )
}


testMinting()
    .then(() => {
        process.exit(0)
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
