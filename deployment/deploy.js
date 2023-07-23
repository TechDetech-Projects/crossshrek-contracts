const { ethers } = require("ethers");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const MNEMONIC = process.env.MNEMONIC;

const baseChainName = "Moonbeam";
const secondaryChain = "Polygon";

const moonbeamProviderUrl = "http://localhost:8500/0";
const moonbeamProvider = new ethers.providers.JsonRpcProvider(
    moonbeamProviderUrl
);
const moonbeamWallet = new ethers.Wallet.fromMnemonic(MNEMONIC).connect(
    moonbeamProvider
);

const polygonProviderUrl = "http://localhost:8500/4";
const polygonProvider = new ethers.providers.JsonRpcProvider(
    polygonProviderUrl
);
const polygonWallet = new ethers.Wallet.fromMnemonic(MNEMONIC).connect(
    polygonProvider
);

const ComptrollerJSON = require("../artifacts/contracts/compound/Comptroller.sol/Comptroller.json");
const SimplePriceOracleJSON = require("../artifacts/contracts/compound/SimplePriceOracle.sol/SimplePriceOracle.json");

const ExampleERC20TokenJSON = require("../artifacts/contracts/test_templates/ExampleERC20Token.sol/ERC20.json");

const ExampleERC20InterestRateModelJSON = require("../artifacts/contracts/test_templates/ExampleERC20InterestRateModel.sol/ExampleERC20InterestRateModel.json");

const CCrosschainErc20JSON = require("../artifacts/contracts/crosschain/CCrosschainErc20.sol/CCrosschainErc20.json");

const CSatelliteJSON = require("../artifacts/contracts/crosschain/CSatellite.sol/CSatellite.json");

async function deployComptroller() {
    const comptrollerFactory = new ethers.ContractFactory(
        ComptrollerJSON.abi,
        ComptrollerJSON.bytecode,
        moonbeamWallet
    );
    const comptrollerContract = await comptrollerFactory.deploy();

    console.log(
        "Comptroller Contract deployed at:",
        comptrollerContract.address,
        " on Moonbeam"
    );

    const simplePriceOracleFactory = new ethers.ContractFactory(
        SimplePriceOracleJSON.abi,
        SimplePriceOracleJSON.bytecode,
        moonbeamWallet
    );
    const simplePriceOracleContract = await simplePriceOracleFactory.deploy();

    console.log(
        "SimplePriceOracle Contract deployed at:",
        simplePriceOracleContract.address,
        "on Moonbeam"
    );

    await comptrollerContract._setPriceOracle(simplePriceOracleContract.address);
    await comptrollerContract._setCloseFactor(5n * BigInt(1e17));
    await comptrollerContract._setLiquidationIncentive(105n * BigInt(1e16));

    console.log("Comptroller setup complete.");

    const exampleERC20TokenFactory = new ethers.ContractFactory(
        ExampleERC20TokenJSON.abi,
        ExampleERC20TokenJSON.bytecode,
        polygonWallet
    );
    const exampleERC20TokenContract = await exampleERC20TokenFactory.deploy();
    console.log(
        "ExampleERC20Token Contract deployed at:",
        exampleERC20TokenContract.address,
        "on Polygon"
    );

    const ERC20MintAmount = BigInt(1e18);
    await exampleERC20TokenContract.mint(ERC20MintAmount);

    const exampleERC20InterestRateModelFactory = new ethers.ContractFactory(
        ExampleERC20InterestRateModelJSON.abi,
        ExampleERC20InterestRateModelJSON.bytecode,
        moonbeamWallet
    );
    const exampleERC20InterestRateModelContract =
        await exampleERC20InterestRateModelFactory.deploy(
            2n * BigInt(1e16),
            5n * BigInt(1e17)
        );
    console.log(
        "ExampleERC20InterestRateModel Contract deployed at:",
        exampleERC20InterestRateModelContract.address,
        "on Moonbeam"
    );

    const moonbeamGatewayAddress = "0x9E404e6ff4F2a15C99365Bd6615fCE3FB9E9Cb76";
    const moonbeamGasServiceAddress = "0x783ce2eF32Aa74B41c8EbbbeC6F632b6Da00C1e9"
    const underlyingSatellitePlaceholder =
        "0x0000000000000000000000000000000000000000";

    const CCrosschainErc20Factory = new ethers.ContractFactory(
        CCrosschainErc20JSON.abi,
        CCrosschainErc20JSON.bytecode,
        moonbeamWallet
    );
    const CCrosschainErc20Contract = await CCrosschainErc20Factory.deploy(
        moonbeamGatewayAddress,
        moonbeamGasServiceAddress,
        secondaryChain,
        underlyingSatellitePlaceholder,
        comptrollerContract.address,
        exampleERC20InterestRateModelContract.address,
        1,
        "Compound Crosschain Token",
        "CCToken",
        8
    );

    console.log(
        "CCrosschainErc20 Contract deployed at:",
        CCrosschainErc20Contract.address,
        "on Moonbeam"
    );
    await comptrollerContract._supportMarket(CCrosschainErc20Contract.address);
    await comptrollerContract._setCollateralFactor(
        CCrosschainErc20Contract.address,
        9n * BigInt(1e17)
    );

    console.log("CCrosschainErc20 first setup step complete.");

    const polygonGatewayAddress = "0xc7B788E88BAaB770A6d4936cdcCcd5250E1bbAd8";
    const polygonGasServiceAddress = "0xC573c722e21eD7fadD38A8f189818433e01Ae466"
    const CSatelliteFactory = new ethers.ContractFactory(
        CSatelliteJSON.abi,
        CSatelliteJSON.bytecode,
        polygonWallet
    );
    const CSatelliteContract = await CSatelliteFactory.deploy(
        polygonGatewayAddress,
        polygonGasServiceAddress,
        baseChainName,
        CCrosschainErc20Contract.address,
        exampleERC20TokenContract.address
    );
    console.log(
        "CSatellite Contract deployed at:",
        CSatelliteContract.address,
        "on Polygon"
    );

    await CCrosschainErc20Contract._setUnderlyingSatellite(CSatelliteContract.address)
    console.log("CCrosschainErc20 setup complete.");

    deployAdresses = {
        moonbeam: {
            Comptroller: comptrollerContract.address,
            SimplePriceOracle: simplePriceOracleContract.address,
            ExampleERC20InterestRateModel: exampleERC20InterestRateModelContract.address,
            CCrosschainErc20: CCrosschainErc20Contract.address,
        },
        polygon: {
            ExampleERC20Token: exampleERC20TokenContract.address,
            CSatellite: CSatelliteContract.address
        }

    }
    console.log(deployAdresses)
    fs.writeFileSync('./deployment/deployAdresses.json', JSON.stringify(deployAdresses), 'utf8', function (err) {
        if (err) throw err;
        console.log('complete');
    });
}

deployComptroller()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
