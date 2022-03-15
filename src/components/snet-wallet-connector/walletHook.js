import Web3 from 'web3';
import { useState, useEffect } from 'react';
import Web3Modal from 'web3modal';
import round from 'lodash/round';
import store from 'store';
import BigNumber from 'bignumber.js';
import { splitSignature } from '@ethersproject/bytes';
import WalletConnectProvider from '@walletconnect/web3-provider';
import ERC20TokenABI from '../../contracts/erc20-abi/abi/SingularityNetToken.json';
import TokenConversionManagerABI from '../../contracts/singularitynet-token-manager/abi/TokenConversionManager.json';
import { availableBlockchains } from '../../utils/ConverterConstants';

const INFURA_KEY = process.env.REACT_APP_INFURA_KEY;
const INFURA_NETWORK_ID = process.env.REACT_APP_INFURA_NETWORK_ID;
const INFURA_NETWORK_NAME = INFURA_NETWORK_ID === '1' ? 'mainnet' : 'ropsten';

let web3 = null;
let provider = null;

const providerOptions = {
  injected: {
    package: null
  },
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: INFURA_KEY
    }
  }
};

const web3Modal = new Web3Modal({
  network: INFURA_NETWORK_NAME,
  cacheProvider: true,
  providerOptions
});

// eslint-disable-next-line import/prefer-default-export
export const useWalletHook = () => {
  const [address, setWalletAddress] = useState(null);
  const [isUserAtExpectedNetwork, setIsUserAtExpectedNetwork] = useState(true);

  const detectNetwork = async () => {
    console.log('@@@@');
    const networkId = await web3.eth.net.getId();
    const expectedNetworkId = process.env.REACT_APP_INFURA_NETWORK_ID;
    console.log(`detectNetwork: networkId: ${networkId}`);
    console.log(`detectNetwork: expectedNetworkId: ${expectedNetworkId}`);
    setIsUserAtExpectedNetwork(Number(networkId) !== Number(expectedNetworkId));
  };

  useEffect(() => {
    detectNetwork();
  }, []);

  const subscribeProvider = async (provider) => {
    if (!provider.on) {
      return;
    }
    provider.on('accountsChanged', async (accounts) => {
      const [address] = accounts;
      setWalletAddress(address);
    });
    provider.on('chainChanged', async (chainId) => {
      detectNetwork();
      const networkId = await web3.eth.net.getId();
      console.log('Network changed');
      console.log('chainChanged', chainId, networkId);
    });
  };

  const connectEthereumWallet = async () => {
    try {
      provider = await web3Modal.connect();
      subscribeProvider(provider);
      await provider.enable();

      web3 = new Web3(provider);
      const [account] = await web3.eth.getAccounts();
      setWalletAddress(web3.utils.toChecksumAddress(account));
      await store.set(availableBlockchains.ETHEREUM, account);
      return web3;
    } catch (error) {
      throw new Error(error.toString());
    }
  };

  const checkWalletHasPreviouslyConnected = async () => {
    const walletAddress = await store.get(availableBlockchains.ETHEREUM);
    if (walletAddress) {
      await connectEthereumWallet();
    }
  };

  useEffect(() => {
    checkWalletHasPreviouslyConnected();
  }, []);

  const getLatestBlock = async () => {
    const block = await web3.eth.getBlockNumber();
    return block;
  };

  const generateSignatureForClaim = async (conversionId, amount, fromAddress, toAddress) => {
    const message = await web3.utils.soliditySha3(
      { type: 'string', value: conversionId },
      { type: 'string', value: amount },
      { type: 'string', value: fromAddress },
      { type: 'string', value: toAddress }
    );

    const hash = await web3.eth.personal.sign(message, address);
    return hash;
  };

  const signMessage = async (tokenPairId, amount, fromAddress, toAddress) => {
    const blockNumber = await getLatestBlock();
    const message = await web3.utils.soliditySha3(
      { type: 'string', value: tokenPairId },
      { type: 'string', value: amount },
      { type: 'string', value: fromAddress },
      { type: 'string', value: toAddress },
      { type: 'uint256', value: blockNumber }
    );

    const hash = await web3.eth.personal.sign(message, address);
    return hash;
  };

  const disconnectEthereumWallet = () => {
    web3Modal.clearCachedProvider();
    setWalletAddress(null);
  };

  const convertToCogs = (amount, decimals) => {
    return new BigNumber(amount).times(10 ** decimals).toFixed();
  };

  const convertAsReadableAmount = (balanceInCogs, decimals) => {
    const rawbalance = new BigNumber(balanceInCogs).dividedBy(new BigNumber(10 ** decimals)).toFixed();
    return round(rawbalance, 2);
  };

  const balanceFromWallet = async (tokenContractAddress) => {
    try {
      const contract = new web3.eth.Contract(ERC20TokenABI, tokenContractAddress);
      const balanceInCogs = await contract.methods.balanceOf(address).call();
      const decimals = await contract.methods.decimals().call();
      const symbol = await contract.methods.symbol().call();
      const balance = convertAsReadableAmount(balanceInCogs, decimals);

      return { symbol, balance };
    } catch (error) {
      throw error.toString();
    }
  };

  const approveSpender = async (tokenContractAddress, spenderAddress) => {
    const limitInCogs = convertToCogs(100000000, 8);
    console.log('Spender Limit : ', limitInCogs);
    console.log('Token contract address', tokenContractAddress);
    const contract = new web3.eth.Contract(ERC20TokenABI, tokenContractAddress);
    const estimateGasLimit = await contract.methods.approve(spenderAddress, limitInCogs).estimateGas({ from: address });
    console.log('approveSpender estimateGasLimit', estimateGasLimit);
    const response = await contract.methods
      .approve(spenderAddress, limitInCogs)
      .send({ from: address })
      .on('transactionHash', (hash) => {
        console.log('approveSpender transactionHash', hash);
      })
      .on('error', (error, receipt) => {
        console.log('approveSpender error', error.toString());
        console.log('approveSpender error receipt', receipt.toString());
      });
    return response;
  };

  // const estimateGasFee = async (estimate) => {
  //   const latestBlock = await web3.eth.getBlock('latest');
  //   const blockGas = latestBlock.gasLimit;
  //   return new BigNumber(blockGas).multipliedBy(estimate).toFixed();
  // };

  const checkAllowance = async (tokenContractAddress, spenderAddress) => {
    const contract = new web3.eth.Contract(ERC20TokenABI, tokenContractAddress);
    const allowanceInCogs = await contract.methods.allowance(address, spenderAddress).call();
    const decimals = await contract.methods.decimals().call();
    return convertAsReadableAmount(allowanceInCogs, decimals);
  };

  const conversionIn = async (contractAddress, amountForMint, conversionId, signature, decimals) => {
    const amount = web3.utils.toNumber(new BigNumber(amountForMint).toFixed());
    const { v, r, s } = splitSignature(signature);
    const hexifiedConsversionId = web3.utils.toHex(conversionId);

    console.log('Conversion amount', amount);
    console.log('To Wallet Address', address);
    console.log('ConversionId', conversionId);

    const contract = new web3.eth.Contract(TokenConversionManagerABI, contractAddress);
    await contract.methods.conversionIn(address, amount, hexifiedConsversionId, v, r, s).estimateGas({ from: address });

    return new Promise((resolve, reject) => {
      contract.methods
        .conversionIn(address, amount, hexifiedConsversionId, v, r, s)
        .send({ from: address })
        .on('transactionHash', (transactionHash) => {
          resolve(transactionHash);
        })
        .on('error', (error, receipt) => {
          console.log('conversionIn error', error.toString());
          console.log('conversionIn error receipt', receipt.toString());
          reject(error.toString());
        });
    });
  };

  const conversionOut = async (contractAddress, amountForBurn, conversionId, signature, decimals) => {
    const amount = web3.utils.toNumber(convertToCogs(amountForBurn, decimals));
    const { v, r, s } = splitSignature(signature);
    const hexifiedConsversionId = web3.utils.toHex(conversionId);

    console.log('Contract Address', contractAddress);
    console.log('Contract decimals', decimals);
    console.log('Amount for burn', amount);
    console.log('conversionId', hexifiedConsversionId);

    const contract = new web3.eth.Contract(TokenConversionManagerABI, contractAddress);
    await contract.methods.conversionOut(amount, hexifiedConsversionId, v, r, s).estimateGas({ from: address });

    return new Promise((resolve, reject) => {
      contract.methods
        .conversionOut(amount, hexifiedConsversionId, v, r, s)
        .send({ from: address })
        .on('transactionHash', (transactionHash) => {
          resolve(transactionHash);
        })
        .on('error', (error, receipt) => {
          console.log('conversionOut error', error.toString());
          console.log('conversionOut error receipt', receipt.toString());
          reject(error.toString());
        });
    });
  };

  return {
    approveSpender,
    checkAllowance,
    connectEthereumWallet,
    disconnectEthereumWallet,
    address,
    signMessage,
    getLatestBlock,
    conversionOut,
    balanceFromWallet,
    convertToCogs,
    isUserAtExpectedNetwork,
    generateSignatureForClaim,
    conversionIn
  };
};
