import propTypes from 'prop-types';
import SnetButton from '../snet-button';

const ADATOETHButton = ({ conversionEnabled, onClickConvert }) => {
  return <SnetButton disabled={!conversionEnabled} name="Convert" onClick={onClickConvert} />;
};

ADATOETHButton.propTypes = {
  conversionEnabled: propTypes.bool.isRequired,
  onClickConvert: propTypes.func.isRequired
};

export default ADATOETHButton;
