import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import propTypes from 'prop-types';
import { Stack } from '@mui/material';
import { toUpper, isEmpty, isNil } from 'lodash';
import SnetPaper from '../../components/snet-paper';
import { useConverterHook } from './hooks/ConverterHook';
import ConversionFormLoader from './ConversionFormLoader';
import TokenPairs from './TokenPairs';
import { useERC20TokenHook } from './hooks/ERC20TokenHook';
import { availableBlockchains, conversionDirections } from '../../utils/ConverterConstants';
import SnetAlert from '../../components/snet-alert';
import SnetLoader from '../../components/snet-loader';
import SnetConversionStatus from '../../components/snet-conversion-status';
import ADATOETHButton from '../../components/snet-converter-form-buttons/ADATOETHButton';
import ETHTOADAButton from '../../components/snet-converter-form-buttons/ETHTOADAButton';

const ERC20TOADA = ({ onADATOETHConversion }) => {
  const { blockchains, wallet } = useSelector((state) => state);
  const {
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
    handleFromInputChange,
    handleToInputChange,
    onUseFullamount,
    fromAndToTokenValues,
    conversionCharge,
    error,
    updateWalletBalance,
    walletBalance
  } = useConverterHook();
  const {
    mintERC20Tokens,
    resetTxnInfo,
    fetchWalletBalance,
    getAllowanceInfo,
    conversionEnabled,
    authorizationRequired,
    approveSpendLimit,
    loader,
    burnERC20Tokens,
    txnInfo
  } = useERC20TokenHook();
  const { toAddress, fromAddress } = wallet;

  const getBalanceFromWallet = async () => {
    const balanceInfo = await fetchWalletBalance(fromTokenPair.token_address);
    updateWalletBalance(balanceInfo);
  };

  useEffect(() => {
    if (!isEmpty(fromTokenPair) && toUpper(fromTokenPair.blockchain.name) === availableBlockchains.ETHEREUM && Number(fromAndToTokenValues.fromValue) > 0) {
      getAllowanceInfo(fromTokenPair.id, fromAndToTokenValues.fromValue);
    }
  }, [fromAndToTokenValues]);

  useEffect(() => {
    if (!isEmpty(fromTokenPair) && toUpper(fromTokenPair.blockchain.name) === availableBlockchains.ETHEREUM) {
      getBalanceFromWallet();
    }
  }, [fromTokenPair]);

  const onClickAuthorize = async () => {
    try {
      await approveSpendLimit(fromTokenPair.id);
    } catch (error) {
      console.log('onClickAuhorize', error);
    }
  };

  const onAdaToEthConversion = async () => {
    try {
      await mintERC20Tokens(fromTokenPair.id, fromAndToTokenValues.fromValue, fromAddress);
    } catch (error) {
      console.log('onAdaToEthConversion', error);
    }
  };

  const onETHToADAConversion = async () => {
    try {
      await burnERC20Tokens(fromTokenPair.id, fromAndToTokenValues.fromValue, toAddress);
    } catch (error) {
      console.log('onClickConvert', error);
      throw error;
    }
  };

  if (blockchains.entities.length === 0) {
    return (
      <SnetPaper>
        <ConversionFormLoader />
      </SnetPaper>
    );
  }

  return (
    <>
      <SnetConversionStatus
        isDialogOpen={!isNil(txnInfo.txnLink)}
        title="Conversion Status"
        amount={txnInfo.txnAmount}
        tokenName={txnInfo.tokenSymbol}
        link={txnInfo.txnLink ?? ''}
        onDialogClose={resetTxnInfo}
      />
      <SnetPaper>
        <SnetLoader dialogBody={loader.message} onDialogClose={() => {}} isDialogOpen={loader.isLoading} dialogTitle={loader.title} />
        <TokenPairs
          fromBlockchains={fromBlockchains}
          fromSelectedBlockchain={fromSelectedBlockchain}
          toBlockchains={toBlockchains}
          toSelectedBlockchain={toSelectedBlockchain}
          handleFromBlockchainSelection={handleFromBlockchainSelection}
          handleToBlockchainSelection={handleToBlockchainSelection}
          onSwapBlockchain={swapBlockchains}
          fromTokenPair={fromTokenPair}
          toTokenPair={toTokenPair}
          onSelectingFromToken={onSelectingFromToken}
          onSelectingToToken={onSelectingToToken}
          onUseFullamount={onUseFullamount}
          fromInputChange={handleFromInputChange}
          toInputChange={handleToInputChange}
          fromInputValue={fromAndToTokenValues.fromValue}
          toInputValue={fromAndToTokenValues.toValue}
          conversionFee={conversionCharge.amount}
          conversionSymbol={conversionCharge.symbol}
          walletBalance={walletBalance.balance}
          walletTokenSymbol={walletBalance.symbol}
        />
        {error.error ? (
          <Stack marginTop={4}>
            <SnetAlert error={error.message} />
          </Stack>
        ) : null}
        <Stack direction="row" alignItems="center" spacing={2} justifyContent="center" padding={4}>
          {wallet.conversionDirection === conversionDirections.ADA_TO_ETH ? (
            <ADATOETHButton conversionEnabled onClickConvert={onAdaToEthConversion} />
          ) : (
            <ETHTOADAButton
              conversionEnabled={conversionEnabled && !error.error}
              authorizationRequired={authorizationRequired}
              onClickConvert={onETHToADAConversion}
              onClickAuthorize={onClickAuthorize}
            />
          )}
        </Stack>
      </SnetPaper>
    </>
  );
};

ERC20TOADA.propTypes = {
  onADATOETHConversion: propTypes.func.isRequired
};

export default ERC20TOADA;
