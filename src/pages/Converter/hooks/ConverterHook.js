import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { isEmpty, round, toUpper } from 'lodash';
import BigNumber from 'bignumber.js';
import { getAvailableTokenPairs } from '../../../services/redux/slices/tokenPairs/tokenPairActions';
import { setConversionDirection, setFromAddress, setToAddress } from '../../../services/redux/slices/wallet/walletSlice';
import { errorMessages, conversionDirections, availableBlockchains } from '../../../utils/ConverterConstants';
import { convertFromCogs, isValueGreaterThanProvided, isValueLessThanProvided } from '../../../utils/bignumber';

const tokenPairDirection = {
  FROM: 'from_token',
  TO: 'to_token'
};

export const useConverterHook = () => {
  const [fromBlockchains, setFromBlockchains] = useState([]);
  const [toBlockchains, setToBlockchains] = useState([]);
  const [fromSelectedBlockchain, setFromSelectedBlockchain] = useState({});
  const [toSelectedBlockchain, setToSelectedBlockchain] = useState({});
  const [fromTokenPair, setFromTokenPair] = useState({});
  const [toTokenPair, setToTokenPair] = useState({});
  const [fromAndToTokenValues, setFromAndToTokenPairs] = useState({ fromValue: 0, toValue: 0 });
  const [walletBalance, setWalletBalance] = useState({ symbol: '', balance: 0 });

  const [conversionCharge, setConversionCharge] = useState({ symbol: '', amount: 0 });
  const [error, setError] = useState({ error: false, message: '' });
  const state = useSelector((state) => state);
  const blockchains = state.blockchains.entities;
  const { tokens } = state.tokenPairs;
  const { wallets } = state.wallet;

  const dispatch = useDispatch();

  const resetError = () => {
    setError({ error: false, message: '' });
  };

  const updateError = (errorMessage) => {
    setError({ error: true, message: errorMessage });
  };

  const updateWalletBalance = (balanceInfo) => {
    if (fromAndToTokenValues.fromValue > balanceInfo.balance) {
      updateError(errorMessages.INSUFFICIENT_BALANCE_FROM);
    } else {
      resetError();
    }
    setWalletBalance(balanceInfo);
  };

  const updateConversionFees = () => {
    const { fromValue } = fromAndToTokenValues;
    if (fromValue > 0 && !isEmpty(fromTokenPair)) {
      let percentageFromSource = 0;
      const [tokenPair] = tokens.filter((token) => token[tokenPairDirection.FROM].id === fromTokenPair.id);
      if (!isEmpty(tokenPair.conversion_fee)) {
        percentageFromSource = BigNumber(tokenPair.conversion_fee.percentage_from_source);
      }

      const { symbol } = tokenPair.from_token;

      const fee = round((percentageFromSource * fromValue) / 100, 2);

      setConversionCharge({ amount: fee, symbol });
    } else {
      setConversionCharge({ amount: 0, symbol: '' });
    }
  };

  const onUseFullamount = (amount) => {
    const amountInString = amount.toString();
    setFromAndToTokenPairs({ ...fromAndToTokenValues, fromValue: amountInString, toValue: amountInString });
  };

  const handleFromInputChange = (event) => {
    const { value } = event.target;

    setFromAndToTokenPairs({ ...fromAndToTokenValues, fromValue: value, toValue: value });

    const [pair] = tokens.filter((token) => token[tokenPairDirection.FROM].id === fromTokenPair.id);

    const pairMinValue = convertFromCogs(pair.min_value, pair.from_token.allowed_decimal);
    const pairMaxValue = convertFromCogs(pair.max_value, pair.from_token.allowed_decimal);

    if (value <= 0) {
      updateError(errorMessages.INVALID_AMOUNT);
    } else if (isValueLessThanProvided(value, pairMinValue)) {
      updateError(errorMessages.MINIMUM_TRANSACTION_AMOUNT + pairMinValue + pair.from_token.symbol);
    } else if (isValueGreaterThanProvided(value, pairMaxValue)) {
      updateError(errorMessages.MAXIMUM_TRANSACTION_AMOUNT + pairMaxValue + pair.from_token.symbol);
    } else if (value > walletBalance.balance) {
      updateError(errorMessages.INSUFFICIENT_BALANCE_FROM);
    } else {
      resetError();
    }
  };

  const handleToInputChange = (event) => {
    const { value } = event.target;
    setFromAndToTokenPairs({ ...fromAndToTokenValues, toValue: value, fromValue: value });
  };

  const onSelectingFromToken = (selectedToken) => {
    const [toPair] = tokens.filter((token) => token[tokenPairDirection.FROM].id === selectedToken.id);
    setFromTokenPair(selectedToken);
    setToTokenPair(toPair[tokenPairDirection.TO]);
  };

  const onSelectingToToken = (selectedToken) => {
    const [fromPair] = tokens.filter((token) => token[tokenPairDirection.TO].id === selectedToken.id);
    setToTokenPair(selectedToken);
    setFromTokenPair(fromPair[tokenPairDirection.FROM]);
  };

  const getTokenPairsForChainConversions = (blockchainList, direction) => {
    return blockchainList.map((blockchain) => {
      const blockchainName = toUpper(blockchain.name);
      const tokenPairs = tokens
        .filter((token) => toUpper(token[direction].blockchain.name) === blockchainName)
        .map((token) => {
          return token[direction];
        });
      return { ...blockchain, tokenPairs };
    });
  };

  const getAndSetBlockchainPairs = () => {
    const blockchainListReversed = [...blockchains].reverse();
    const fromBlockchainsWithTokenPairs = getTokenPairsForChainConversions(blockchainListReversed, tokenPairDirection.FROM);
    const toBlockchainsWithTokenPairs = getTokenPairsForChainConversions(blockchains, tokenPairDirection.TO);
    setFromBlockchains(fromBlockchainsWithTokenPairs);
    setToBlockchains(toBlockchainsWithTokenPairs);
    setFromSelectedBlockchain(fromBlockchainsWithTokenPairs[0]);
    setToSelectedBlockchain(toBlockchainsWithTokenPairs[0]);
    console.log('fromBlockchainsWithTokenPairs[0]', fromBlockchainsWithTokenPairs[0]);
    setFromTokenPair(fromBlockchainsWithTokenPairs[0].tokenPairs[0]);
    setToTokenPair(toBlockchainsWithTokenPairs[0].tokenPairs[0]);
  };

  const swapBlockchains = () => {
    setFromBlockchains(toBlockchains);
    setToBlockchains(fromBlockchains);
    setFromSelectedBlockchain(toBlockchains[0]);
    setToSelectedBlockchain(fromBlockchains[0]);
    setFromTokenPair(toBlockchains[0].tokenPairs[0]);
    setToTokenPair(fromBlockchains[0].tokenPairs[0]);

    updateConversionFees();
  };

  const handleFromBlockchainSelection = () => {
    swapBlockchains();
  };

  const handleToBlockchainSelection = () => {
    swapBlockchains();
  };

  useEffect(() => {
    if (tokens.length < 1) {
      dispatch(getAvailableTokenPairs());
    }
  }, []);

  useEffect(() => {
    if (tokens.length > 0) {
      getAndSetBlockchainPairs();
    }
  }, [tokens]);

  useEffect(() => {
    if (!isEmpty(fromTokenPair)) {
      updateConversionFees();
    }
  }, [fromAndToTokenValues]);

  const detectAndUpdateConversionDirection = () => {
    if (!isEmpty(fromTokenPair) || !isEmpty(toTokenPair)) {
      const FROM = fromSelectedBlockchain.symbol;
      const TO = toSelectedBlockchain.symbol;
      const direction = `${FROM}_TO_${TO}`;
      dispatch(setConversionDirection(direction));

      if (!isEmpty(wallets)) {
        const cardanoAddress = wallets[availableBlockchains.CARDANO];
        const ethereumAddress = wallets[availableBlockchains.ETHEREUM];

        const fromAddress = direction === conversionDirections.ADA_TO_ETH ? cardanoAddress : ethereumAddress;
        const toAddress = direction === conversionDirections.ADA_TO_ETH ? ethereumAddress : cardanoAddress;

        dispatch(setFromAddress(fromAddress));
        dispatch(setToAddress(toAddress));
      }
    }
  };

  useEffect(() => {
    detectAndUpdateConversionDirection();
  }, [toSelectedBlockchain, fromSelectedBlockchain]);

  return {
    handleFromInputChange,
    handleToInputChange,
    fromAndToTokenValues,
    conversionCharge,
    onUseFullamount,
    setFromSelectedBlockchain,
    setToSelectedBlockchain,
    fromBlockchains,
    toBlockchains,
    fromSelectedBlockchain,
    toSelectedBlockchain,
    handleFromBlockchainSelection,
    handleToBlockchainSelection,
    swapBlockchains,
    fromTokenPair,
    toTokenPair,
    onSelectingFromToken,
    onSelectingToToken,
    error,
    walletBalance,
    updateWalletBalance
  };
};
