const { readFileSync, writeFileSync } = require('fs');
const Web3 = require('web3');
const config = require('../truffle.js');
const { coefficientsToString, decimalToString } = require('../dist/src/lib/Helpers');

// ============ Network Helper Functions ============

async function setGlobalOperatorIfNecessary(dolomiteMargin, contractAddress) {
  if (!(await dolomiteMargin.getIsGlobalOperator(contractAddress))) {
    await dolomiteMargin.ownerSetGlobalOperator(contractAddress, true);
  }
}

async function setAutoTraderSpecialIfNecessary(dolomiteMargin, contractAddress) {
  if (!(await dolomiteMargin.getIsAutoTraderSpecial(contractAddress))) {
    await dolomiteMargin.ownerSetAutoTraderSpecial(contractAddress, true);
  }
}

function isDevNetwork(network) {
  verifyNetwork(network);
  return network === 'dev' || network === 'docker' || isCoverageTestNetwork(network) || isLocalTestNetwork(network);
}

function isLocalTestNetwork(network) {
  verifyNetwork(network);
  return network.startsWith('test');
}

function isCoverageTestNetwork(network) {
  verifyNetwork(network);
  return network.startsWith('coverage');
}

// ================== Filtered Networks ==================

function isArbitrumNetwork(network) {
  return isArbitrumOne(network) || isArbitrumSepolia(network);
}

function isPolygonZkEvmNetwork(network) {
  return isPolygonZkEvm(network);
}

function isBeraNetwork(network) {
  return isBeraBartio(network) || isBeraCartio(network);
}

function isMantleNetwork(network) {
  return isMantle(network);
}

function isXLayerNetwork(network) {
  return isXLayer(network);
}

function isBaseNetwork(network) {
  return isBase(network);
}

// ================== Production Networks ==================

function isArbitrumOne(network) {
  verifyNetwork(network);
  return network === 'arbitrum_one';
}

function isArbitrumSepolia(network) {
  verifyNetwork(network);
  return network === 'arbitrum_sepolia';
}

function isBase(network) {
  verifyNetwork(network);
  return network === 'base';
}

function isEthereumMainnet(network) {
  verifyNetwork(network);
  return network === 'mainnet';
}

function isBeraBartio(network) {
  verifyNetwork(network);
  return network === 'berachain_bartio';
}

function isBeraCartio(network) {
  verifyNetwork(network);
  return network === 'berachain_cartio';
}

function isInk(network) {
  verifyNetwork(network);
  return network === 'ink';
}

function isMantle(network) {
  verifyNetwork(network);
  return network === 'mantle';
}

function isPolygonZkEvm(network) {
  verifyNetwork(network);
  return network === 'polygon_zkevm';
}

function isSuperSeed(network) {
  verifyNetwork(network);
  return network === 'super_seed';
}

function isXLayer(network) {
  verifyNetwork(network);
  return network === 'x_layer';
}

// ================== Test Networks ==================

function isDocker(network) {
  verifyNetwork(network);
  return network === 'docker';
}

function getChainId(network) {  
  if (isDevNetwork(network)) {
    return 1313;
  }
  if (isEthereumMainnet(network)) {
    return 1;
  }
  if (isArbitrumOne(network)) {
    return 42161;
  }
  if (isArbitrumSepolia(network)) {
    return 421614;
  }
  if (isBase(network)) {
    return 8453;
  }
  if (isBeraBartio(network)) {
    return 80084;
  }
  if (isBeraCartio(network)) {
    return 80000;
  }
  if (isCoverageTestNetwork(network)) {
    return 1002;
  }
  if ('docker' === network) {
    return 1313;
  }
  if (isInk(network)) {
    return 57073;
  }
  if (isLocalTestNetwork(network)) {
    return 1001;
  }
  if (isMantle(network)) {
    return 5000;
  }
  if (isPolygonZkEvm(network)) {
    return 1101;
  }
  if (isSuperSeed(network)) {
    return 5330;
  }
  if (isXLayer(network)) {
    return 196;
  }
  throw new Error('No chainId for network ' + network);
}

async function getRiskLimits() {
  return {
    marginRatioMax: decimalToString('2.00'), // 200%
    liquidationSpreadMax: decimalToString('0.50'), // 50%
    earningsRateMax: decimalToString('1.00'), // 100%
    marginPremiumMax: decimalToString('2.00'), // 200%
    liquidationSpreadPremiumMax: decimalToString('5.00'), // 500%
    interestRateMax: decimalToString('100.00'), // 10,000%
    minBorrowedValueMax: '100000000000000000000000000000000000000', // $100
  };
}

async function getRiskParams(network) {
  verifyNetwork(network);
  let minBorrowedValue = '0.00';
  if (isDevNetwork(network)) {
    minBorrowedValue = '0.05';
  }
  return {
    marginRatio: { value: decimalToString('0.15') },
    liquidationSpread: { value: decimalToString('0.05') },
    earningsRate: { value: decimalToString('0.85') },
    minBorrowedValue: { value: decimalToString(minBorrowedValue) },
    accountMaxNumberOfMarketsWithBalances: '32',
    callbackGasLimit: 2000000, // 2M
  };
}

async function getPolynomialParams() {
  return {
    maxAPR: decimalToString('1.00'), // 100%
    coefficients: coefficientsToString([0, 10, 10, 0, 0, 80]),
  };
}

async function getDoubleExponentParams() {
  return {
    maxAPR: decimalToString('1.00'), // 100%
    coefficients: coefficientsToString([0, 20, 0, 0, 0, 0, 20, 60]),
  };
}

function getExpiryRampTime() {
  return '300'; // 5 minutes
}

async function getFeeData(network) {   
  return {
    maxFeePerGas: 5000000000000,
    maxPriorityFeePerGas: 500000000,
  };
}

function verifyNetwork(network) {
  if (!network) {
    throw new Error('No network provided');
  }
}

function getCREATE3FactoryAddress(network) {
  const networkConfig = config.networks[network];
  return networkConfig.create3FactoryAddress || "0xa8F7e7A361De6A2172fcb2accE68bd21597599F7";
}

function getDelayedMultisigAddress(network) {
  if (
    isArbitrumNetwork(network) ||
    isBeraNetwork(network) ||
    isBaseNetwork(network) ||
    isEthereumMainnet(network) ||
    isInk(network) ||
    isMantleNetwork(network) ||
    isPolygonZkEvmNetwork(network) ||
    isSuperSeed(network) ||
    isXLayerNetwork(network)
  ) {
    return process.env.DELAYED_MULTISIG_ADDRESS;
    //return '0x52d7BcB650c591f6E8da90f797A1d0Bfd8fD05F9';
  }
  throw new Error('Cannot find DelayedMultisig for network: ' + network);
}

function getChainlinkOracleSentinelGracePeriod() {
  return 3600; // 1 hour
}

function getChainlinkSequencerUptimeFeed(network, TestSequencerUptimeFeedAggregator) {
  if (isDevNetwork(network)) {
    return TestSequencerUptimeFeedAggregator.address;
  } else if (isArbitrumOne(network)) {
    return '0xFdB631F5EE196F0ed6FAa767959853A9F217697D';
  } else if (isBase(network)) {
    return '0xBCF85224fc0756B9Fa45aA7892530B47e10b6433';
  } else if (
    isBeraNetwork(network) ||
    isInk(network) ||
    isMantle(network) ||
    isPolygonZkEvm(network) ||
    isSuperSeed(network) ||
    isXLayer(network)
  ) {
    return null;
  }

  throw new Error(`Cannot find Sequencer Uptime Feed for ${network}`);
}

const shouldOverwrite = (contract, network) => {
  const basicCondition = process.env.OVERWRITE_EXISTING_CONTRACTS === 'true' || isDevNetwork(network);
  if (basicCondition) {
    return true;
  }

  try {
    return !contract.address;
  } catch (e) {
    // The address can't be retrieved, which means there isn't one.
    return true;
  }
};

const getNoOverwriteParams = () => ({ overwrite: false });

const removeEntriesWithKey = (data, keyToRemove) => {
  Object.keys(data).forEach(contract => {
    if (data[contract].hasOwnProperty(keyToRemove)) {
      delete data[contract][keyToRemove];
    }
  });
  return data;
}

const removeDeployedAddresses = (networkIds) => {
  let json = JSON.parse(readFileSync('migrations/deployed.json').toString());
  
  networkIds.forEach(networkId => {
    json = removeEntriesWithKey(json, networkId);
  });

  writeFileSync('migrations/deployed.json', JSON.stringify(sortFileAndReturn(json), null, 2));
}


async function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

async function deployContractIfNecessary(artifacts, deployer, network, artifact, parameters) {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      await _deployContractIfNecessary(artifacts, deployer, network, artifact, parameters);
      console.log('Deployment successful on attempt:', attempt + 1);
      return;
    } catch (error) {
      attempt++;
      console.error(`Deployment attempt ${attempt} failed:`, error);

      if (attempt < MAX_RETRIES) {
        console.log(`Retrying deployment... (${attempt}/${MAX_RETRIES})`);
        await sleep(RETRY_DELAY);
      } else {
        console.error('Deployment failed after maximum retries.');
        throw error;
      }
    }
  }
}

async function _deployContractIfNecessary(artifacts, deployer, network, artifact, parameters) {
  
  const contractName = artifact.toJSON().contractName;
  console.log("Deploying", contractName);

  await sleep(2000);

  if (shouldOverwrite(artifact, network)) {
    if (!isDevNetwork(network)) {
      const json = JSON.parse(readFileSync('migrations/deployed.json').toString());
      if (
        json[contractName] &&
        json[contractName][getChainId(network)] &&
        json[contractName][getChainId(network)].address &&
        json[contractName][getChainId(network)].address !== '0x0000000000000000000000000000000000000000'
      ) {
        console.log("Already deployed. Returning existing address...");
        return await artifact.at(json[contractName][getChainId(network)].address);
      }      

      await sleep(1000);

      const web3 = new Web3(deployer.provider);
      let bytecode = artifact.bytecode;
      Object.keys(artifact.links).forEach(key => {
        bytecode = bytecode.split(`__${key}${'_'.repeat(38 - key.length)}`).join(artifact.links[key].substring(2));
      });
      const code = new web3.eth.Contract(artifact.toJSON().abi)
        .deploy({
          data: bytecode,
          arguments: parameters ? parameters : [],
        })
        .encodeABI();

      const salt = Web3.utils.keccak256(web3.eth.abi.encodeParameters(['string'], [contractName]));      

      const create3FactoryAddress = getCREATE3FactoryAddress(network);

      const CREATE3Factory = await artifacts
        .require('ICREATE3Factory')
        .at(create3FactoryAddress);        

      console.log("Got CREATE3Factory instance at", create3FactoryAddress);

      await sleep(1000);

      let transactionHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const privateKey = "0x" + process.env.DEPLOYER_PRIVATE_KEY;      
      const deployerAddress = web3.eth.accounts.privateKeyToAccount(privateKey);
      console.log("Deployer address", deployerAddress.address);
      const contractAddress = await CREATE3Factory.getDeployed(deployerAddress.address, salt);
      console.log("Predicted contract address", contractAddress);
      if ((await web3.eth.getCode(contractAddress)) === '0x') {

        console.log("Calling CREATE3Factory.deploy...");

        console.log("Sleeping... (because of the RPC limit)");
        await sleep(10000);                           

        const deployData = CREATE3Factory.contract.methods.deploy(salt, code).encodeABI();
        const gasEstimate = await web3.eth.estimateGas({
          from: deployerAddress.address,
          to: CREATE3Factory.address,
          data: deployData
        });

        console.log("Gas estimate for deploy:", gasEstimate);

        const feeData = await getFeeData(network);        
        const tx = {
          from: deployerAddress.address,
          to: CREATE3Factory.address,
          data: deployData,
          gas: Math.max(gasEstimate, config.networks[network].gas),
          maxFeePerGas: config.networks[network].maxFeePerGas || feeData.maxFeePerGas, 
          maxPriorityFeePerGas: config.networks[network].maxPriorityFeePerGas || feeData.maxPriorityFeePerGas,
          nonce: await web3.eth.getTransactionCount(deployerAddress.address)
        };

        console.log("Signing transaction");

        await sleep(2000);

        const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);                  
        const transactionPromise = web3.eth.sendSignedTransaction(signedTx.rawTransaction);
                
        let receipt;
        transactionPromise.once('transactionHash', async (hash) => {
          console.log('Transaction hash:', hash);
      
          try {
            receipt = await pollForReceipt(web3, hash, 60000);
            console.log('Got receipt', receipt);                        
            transactionHash = receipt.transactionHash;
            
          } catch (error) {
            console.error('Error while polling for receipt:', error);
          }
        });
      
        transactionPromise.once('error', (error) => {
          console.error('Deployment failed:', error);
        });        

        if (!receipt) {
          throw "Receipt not received!";
        }

        await sleep(2000);

      }

      if (!json[contractName][getChainId(network)] || !json[contractName][getChainId(network)].address) {
        const data = {
          links: artifact.links,
          address: contractAddress,
          transactionHash: transactionHash,
        };
        console.log(
          '='.repeat(49 - (contractName.length / 2)),
          contractName,
          '='.repeat(49 - (contractName.length / 2)),
        );
        console.log(JSON.stringify(data, null, 2));
        console.log('='.repeat(100));
        json[contractName][getChainId(network)] = data;
        writeFileSync('migrations/deployed.json', JSON.stringify(sortFileAndReturn(json), null, 2));
      }

      await sleep(2000);

      return await artifact.at(contractAddress);
    } else {
      console.log("Deploying to dev/local/docker network...");
      await deployer.deploy(artifact, ...(parameters ? parameters : []));
      return await artifact.deployed();
    }
  } else {
    const json = JSON.parse(readFileSync('migrations/deployed.json').toString());
    return artifact.at(json[contractName][getChainId(network)].address);
  }
}

async function pollForReceipt(web3, txHash, timeout) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkInterval = 1000;

    const checkReceipt = async (web3) => {
      try {
        const receipt = await web3.eth.getTransactionReceipt(txHash);
        if (receipt) {
          resolve(receipt);
        } else if (Date.now() - startTime < timeout) {
          setTimeout(() => { checkReceipt(web3); }, checkInterval);
        } else {
          reject(new Error("Transaction receipt not found within the timeout period"));
        }
      } catch (error) {
        console.error("Error while fetching receipt:", error);
        setTimeout(() => { checkReceipt(web3); }, checkInterval);
      }
    };

    checkReceipt(web3);
  });
}

function sortFileAndReturn(file) {
  const sortedFileKeys = Object.keys(file).sort((a, b) => {
    const aSplitPoint = a.search(/V\d+$/);
    const bSplitPoint = b.search(/V\d+$/);
    if (aSplitPoint !== -1 && bSplitPoint !== -1) {
      const aBase = a.substring(0, aSplitPoint);
      const bBase = b.substring(0, bSplitPoint);
      if (aBase === bBase) {
        const aVersion = a.substring(aSplitPoint + 1);
        const bVersion = b.substring(bSplitPoint + 1);
        return parseInt(aVersion, 10) - parseInt(bVersion, 10);
      }
    }
    return a.localeCompare(b);
  });
  const sortedFile = {};
  for (const key of sortedFileKeys) {
    sortedFile[key] = file[key];
  }
  return sortedFile;
}

async function getContract(network, artifact) {
  if (isDevNetwork(network)) {
    return artifact.at(artifact.address);
  } else {
    const contractName = artifact.toJSON().contractName;
    const json = JSON.parse(readFileSync('migrations/deployed.json').toString());
    return await artifact.at(json[contractName][getChainId(network)].address);
  }
}

module.exports = {
  isArbitrumNetwork,
  isBase,
  isBaseNetwork,
  isPolygonZkEvmNetwork,
  isArbitrumOne,
  getChainId,
  isDevNetwork,
  isEthereumMainnet,
  isBeraNetwork,
  isBeraCartio,
  isInk,
  isMantleNetwork,
  isPolygonZkEvm,
  isSuperSeed,
  isXLayerNetwork,
  isDocker,
  getRiskLimits,
  getRiskParams,
  getPolynomialParams,
  getDoubleExponentParams,
  getExpiryRampTime,
  getDelayedMultisigAddress,
  getChainlinkSequencerUptimeFeed,
  getChainlinkOracleSentinelGracePeriod,
  shouldOverwrite,
  getNoOverwriteParams,
  setGlobalOperatorIfNecessary,
  setAutoTraderSpecialIfNecessary,
  deployContractIfNecessary,
  getContract,
  removeDeployedAddresses
};
