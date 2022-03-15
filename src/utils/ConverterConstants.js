const progress = {
  IDLE: 'IDLE',
  PROCESSING: 'Processing',
  COMPLETE: 'Success',
  ERROR: 'Error'
};

export const conversionStatuses = {
  PROCESSING: 'Processing',
  USER_INITIATED: 'Processing',
  COMPLETE: 'Action Required',
  IDLE: 'IDLE'
};

export const conversionDirection = {
  FROM: 'FROM',
  TO: 'TO'
};

export const availableBlockchains = {
  CARDANO: 'CARDANO',
  ETHEREUM: 'ETHEREUM'
};

export const externalLinks = {
  TERMS_AND_CONDITIONS: 'https://public.singularitynet.io/terms_and_conditions.html'
};

export const conversionSteps = {
  DEPOSIT_TOKENS: 0,
  BURN_TOKENS: 1,
  CLAIM_TOKENS: 2,
  SUMMARY: 3
};

export const conversionStepsForAdaToEth = [
  {
    label: 'Deposit Tokens',
    step: conversionSteps.DEPOSIT_TOKENS,
    progress: progress.IDLE
  },
  {
    label: 'Burn Tokens',
    step: conversionSteps.BURN_TOKENS,
    progress: progress.IDLE
  },
  {
    label: 'Claim Tokens',
    step: conversionSteps.CLAIM_TOKENS,
    progress: progress.IDLE
  },
  {
    label: 'Summary',
    step: conversionSteps.SUMMARY,
    progress: progress.IDLE
  }
];

export const errorMessages = {
  INVALID_TOKEN_PAIR: 'Invalid token pair',
  INVALID_TOKEN_PAIR_FROM: 'Invalid token pair from',
  INVALID_TOKEN_PAIR_TO: 'Invalid token pair to',
  INSUFFICIENT_BALANCE_FROM: 'Insufficient wallet balance from',
  INSUFFICIENT_BALANCE_TO: 'Insufficient wallet balance to',
  LIMIT_EXCEEDED_FROM: 'Limit exceeded from',
  MINIMUM_TRANSACTION_AMOUNT: 'Minimum transaction amount is ',
  MAXIMUM_TRANSACTION_AMOUNT: 'Maximum transaction amount is ',
  LIMIT_EXCEEDED_TO: 'Limit exceeded to',
  INVALID_AMOUNT: 'Invalid amount'
};
