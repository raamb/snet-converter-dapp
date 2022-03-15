import propTypes from 'prop-types';
import SnetButton from '../snet-button';

const ETHTOADAButton = ({ conversionEnabled, authorizationRequired, onClickConvert, onClickAuthorize }) => {
  return (
    <>
      <SnetButton disabled={!conversionEnabled} name="Convert" onClick={onClickConvert} />
      <SnetButton disabled={!authorizationRequired} name="Authorize" onClick={onClickAuthorize} />
    </>
  );
};

ETHTOADAButton.propTypes = {
  conversionEnabled: propTypes.bool.isRequired,
  authorizationRequired: propTypes.bool.isRequired,
  onClickConvert: propTypes.func.isRequired,
  onClickAuthorize: propTypes.func.isRequired
};

export default ETHTOADAButton;
