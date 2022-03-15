import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import upperCase from 'lodash/upperCase';
import { isValidShelleyAddress } from 'cardano-crypto.js';
import propTypes from 'prop-types';
import { Divider, Box, Typography } from '@mui/material';
import { isEmpty, isNil } from 'lodash';
import store from 'store';

import WalletNotConnectedMenu from './WalletNotConnectedMenu';
import WalletConnectedMenu from './WalletConnectedMenu';
import SnetDialog from '../snet-dialog';
import SnetBlockchainList from '../snet-blockchains-list';
import { useWalletHook } from '../snet-wallet-connector/walletHook';
import SnetSnackbar from '../snet-snackbar';
import SnetButton from '../snet-button';
import { setWallets, removeFromAndToAddress } from '../../services/redux/slices/wallet/walletSlice';
import { availableBlockchains, externalLinks } from '../../utils/ConverterConstants';

const SnetNavigation = ({ blockchains }) => {
  const [enableAgreeButton, setEnableAgreeButton] = useState(false);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  const [cardanoAddress, setCardanoAddress] = useState(null);
  const [error, setError] = useState({ showError: false, message: '' });
  const { address, disconnectEthereumWallet, connectEthereumWallet } = useWalletHook();
  const state = useSelector((state) => state);
  const { wallets } = state.wallet;

  const dispatch = useDispatch();

  const enableOrDisableAgreebutton = () => {
    const isCardanoAddressAvailable = !isNil(cardanoAddress);
    const isEthereumAddressAvailable = !isNil(address);

    const addressessAvailable = isCardanoAddressAvailable && isEthereumAddressAvailable;
    setEnableAgreeButton(addressessAvailable);
  };

  useEffect(() => {
    const cachedCardanoAddress = store.get(availableBlockchains.CARDANO) ?? null;
    setCardanoAddress(cachedCardanoAddress);
  });

  useEffect(() => {
    enableOrDisableAgreebutton();
  }, [cardanoAddress, address]);

  const toggleWalletConnecting = () => {
    setIsWalletConnecting(!isWalletConnecting);
  };

  const openAvailableWalletOptions = () => {
    toggleWalletConnecting();
  };

  const openTermsAndConditions = () => {
    window.open(externalLinks.TERMS_AND_CONDITIONS, '_blank');
  };

  const getWalletAddress = (blockchain) => {
    const blockchainName = upperCase(blockchain);
    if (blockchainName === availableBlockchains.ETHEREUM) {
      return address;
    }
    if (blockchainName === availableBlockchains.CARDANO) {
      return cardanoAddress;
    }
    return null;
  };

  const getWalletPairs = () => {
    return {
      [availableBlockchains.ETHEREUM]: address,
      [availableBlockchains.CARDANO]: cardanoAddress
    };
  };

  const setWalletAddresses = () => {
    dispatch(setWallets(getWalletPairs()));
  };

  useEffect(() => {
    // Fetching wallet addresses from cache
    if (!isNil(address) && !isNil(cardanoAddress)) {
      setWalletAddresses();
    }
  }, [address, cardanoAddress]);

  const onSaveAddress = async (cardanoWalletAddress) => {
    // Saving Cardano address to cache

    const isValidCardanoWalletAddress = isValidShelleyAddress(cardanoWalletAddress);

    if (isValidCardanoWalletAddress) {
      setCardanoAddress(cardanoWalletAddress);
      await store.set(availableBlockchains.CARDANO, cardanoWalletAddress);
    } else {
      setError({ showError: true, message: 'Invalid Cardano wallet address' });
    }
  };

  const onClickDisconnectWallet = (blockchain) => {
    const blockchainName = upperCase(blockchain);
    if (blockchainName === availableBlockchains.ETHEREUM) {
      disconnectEthereumWallet();
    }
    if (blockchainName === availableBlockchains.CARDANO) {
      setCardanoAddress(null);
      store.remove(availableBlockchains.CARDANO);
    }

    dispatch(removeFromAndToAddress());
  };

  const getSignatureFromWallet = async () => {
    try {
      setWalletAddresses();
      toggleWalletConnecting();
    } catch (e) {
      const message = e.message.toString() ?? e.toString();
      setError({ showError: true, message });
    }
  };

  const closeError = () => {
    setError({ showError: false, message: '' });
  };

  return (
    <>
      <SnetSnackbar open={error.showError} message={error.message} onClose={closeError} />
      <SnetDialog title="Connect Wallets" onDialogClose={toggleWalletConnecting} isDialogOpen={isWalletConnecting}>
        {blockchains.map((blockchain) => {
          return (
            <SnetBlockchainList
              key={blockchain.id}
              blockchain={blockchain.name}
              blockchainLogo={blockchain.logo}
              blockChainConnectInfo={blockchain.description}
              isWalletAvailable={blockchain.is_extension_available}
              walletAddress={getWalletAddress(blockchain.name)}
              onSaveAddress={onSaveAddress}
              openWallet={connectEthereumWallet}
              disconnectWallet={() => onClickDisconnectWallet(blockchain.name)}
            />
          );
        })}
        <Divider sx={{ marginTop: 2, marginBottom: 2 }} />
        <Box display="flex" justifyContent="end" alignItems="center">
          <Typography variant="caption" marginRight={1}>
            By connecting to the wallets, you agree to our
          </Typography>
          <Typography onClick={openTermsAndConditions} variant="caption" color="primary" cursor="pointer" sx={{ cursor: 'pointer' }} marginRight={2}>
            Terms & Conditions
          </Typography>
          <SnetButton onClick={getSignatureFromWallet} disabled={!enableAgreeButton} name="Agree" />
        </Box>
      </SnetDialog>
      {!isEmpty(wallets) ? (
        <WalletConnectedMenu openConnectedWallets={openAvailableWalletOptions} />
      ) : (
        <WalletNotConnectedMenu onConnectWallets={openAvailableWalletOptions} />
      )}
    </>
  );
};

SnetNavigation.propTypes = {
  blockchains: propTypes.arrayOf(propTypes.object)
};

export default SnetNavigation;
