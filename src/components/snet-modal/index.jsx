import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import style from './style';

const SnetModal = ({ open, handleClose, heading, message }) => {
  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
      <Box sx={style.box}>
        <Typography sx={style.heading}>{heading}</Typography>
        <Typography sx={style.message}>{message}</Typography>
      </Box>
    </Modal>
  );
};

SnetModal.propTypes = {
  handleClose: PropTypes.func,
  heading: PropTypes.string,
  message: PropTypes.string,
  open: PropTypes.bool
};

SnetModal.defaultProps = {
  open: false
};

export default SnetModal;
