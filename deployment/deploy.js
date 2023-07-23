const { ethers } = require('ethers');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config()

const MNEMONIC = process.env.MNEMONIC


const moonbeamProviderUrl = "http://localhost:8500/0"

const moonbeamProvider = new ethers.providers.JsonRpcProvider(moonbeamProviderUrl);
const moonbeamWallet = new ethers.Wallet.fromMnemonic(MNEMONIC).connect(moonbeamProvider);

const ComptrollerJSON = require('../artifacts/contracts/compound/Comptroller.sol/Comptroller.json');


async function deployComptroller() {
    
    const factory = new ethers.ContractFactory(ComptrollerJSON.abi, ComptrollerJSON.bytecode, moonbeamWallet);
    const contract = await factory.deploy();
    const ComptrollerInstance = await contract.deployed();

    console.log('Comptroller Contract deployed at:', contract.address);

  }

  deployComptroller()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });