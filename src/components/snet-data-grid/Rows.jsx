// import { useState } from 'react';
// import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
// import IconButton from '@mui/material/IconButton';
// import Collapse from '@mui/material/Collapse';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import propTypes from 'prop-types';
// import CardActions from '@mui/material/CardActions';
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// const ExpandMore = styled((props) => {
//   const { expand, ...other } = props;
//   return <IconButton {...other} />;
// })(({ theme, expand }) => ({
//   transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
//   marginLeft: 'auto',
//   transition: theme.transitions.create('transform', {
//     duration: theme.transitions.duration.shortest
//   })
// }));

const Rows = ({ date, fromToken, toToken, fromAddress, toAddress, chainType, status }) => {
  //   const [expanded, setExpanded] = useState(false);

  //   const handleExpandClick = () => {
  //     setExpanded(!expanded);
  //   };

  const availableStatus = {
    USER_INITIATED: 'Processing',
    SUCCESS: 'Success',
    PROCESSING: 'Processing'
  };

  return (
    <>
      <Box display="flex" alignItems="center" justifyContent="space-between" paddingY={2}>
        <Typography textTransform="uppercase" variant="caption" color="grey">
          {date}
        </Typography>
        <Box display="flex" alignItems="center">
          <Typography textTransform="uppercase" variant="caption" color="grey">
            {chainType}
          </Typography>
        </Box>
        <Box width="120px" overflow="hidden">
          <Typography textTransform="uppercase" variant="body2" color="grey">
            {fromToken}
          </Typography>
          <Typography textOverflow="ellipsis" overflow="hidden" textTransform="uppercase" variant="caption" color="grey">
            {fromAddress}
          </Typography>
        </Box>
        <Box width="120px" overflow="hidden">
          <Typography textAlign="left" variant="body2" color="grey">
            {toToken}
          </Typography>
          <Typography textAlign="left" textOverflow="ellipsis" overflow="hidden" variant="caption" color="grey">
            {toAddress}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center">
          {status === availableStatus.USER_INITIATED ? <WarningIcon fontSize="small" color="warning" /> : null}
          {status === availableStatus.SUCCESS ? <CheckCircleOutlineIcon fontSize="small" color="success" /> : null}
          {status === availableStatus.PROCESSING ? <HourglassBottomIcon fontSize="small" color="primary" /> : null}
          <Typography variant="caption">{status}</Typography>
        </Box>
        {/* <CardActions disableSpacing>
          <ExpandMore expand={expanded} onClick={handleExpandClick} aria-expanded={expanded} aria-label="show more">
            <ExpandMoreIcon />
          </ExpandMore>
        </CardActions> */}
      </Box>
      {/* <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Typography paragraph>Txn Hash</Typography>
      </Collapse> */}
    </>
  );
};

Rows.propTypes = {
  date: propTypes.string.isRequired,
  fromToken: propTypes.string.isRequired,
  toToken: propTypes.string.isRequired,
  fromAddress: propTypes.string.isRequired,
  toAddress: propTypes.string.isRequired,
  chainType: propTypes.string.isRequired,
  status: propTypes.string.isRequired
};

export default Rows;
