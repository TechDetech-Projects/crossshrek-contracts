# crossshrek-contracts
Contracts and deployment for CrossShrek crosschain lending pool

<p align="center">
  <img src="https://github.com/TechDetech-Projects/crossshrek-contracts/assets/33973526/911ebe6c-d1c7-4be8-8e1d-c8b4f3119a58">
</p>

# Testing
**Prerequisites**
- Have Node.js installed
- Run a set of local testchains and an Axelar test node as seen in the [axelar-examples](https://github.com/axelarnetwork/axelar-examples/tree/main) repo.

First, compile all the contracts and generate the `artifacts` folder running on the following on the root of the repo:
```
npx hardhat compile
```

Now, deploy and initialize the contracts using:
```
node deployment/deploy.js
```

Finally, test suppliyng a token to a lending pool using:
```
node deployment/test_deployment.js    
```
