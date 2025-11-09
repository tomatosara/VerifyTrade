import { ValidationError } from '@utils/errors';

export const AMOUNT_REGEX =
  /^(?!0+(?:\.0+)?$)(\d{1,18})(?:\.(\d{1,18}))?$/;

const normalizeInteger = (value: string): string => {
  const trimmed = value.replace(/^0+(?=\d)/, '');
  return trimmed.length ? trimmed : '0';
};

const normalizeFraction = (value?: string): string => {
  if (!value) {
    return '';
  }
  return value.replace(/0+$/, '');
};

export function normalizeAmountString(value: string, field = 'amount'): string {
  const candidate = value?.trim();
  const match = candidate.match(AMOUNT_REGEX);

  if (!match) {
    throw new ValidationError('Invalid amount format', {
      field,
      constraints: {
        amount: 'Must be a positive decimal string with up to 18 decimal places'
      }
    });
  }

  const [, integerPart, fractionPart] = match;
  const normalizedInteger = normalizeInteger(integerPart);
  const normalizedFraction = normalizeFraction(fractionPart);

  if (normalizedInteger === '0' && !normalizedFraction) {
    throw new ValidationError('Amount must be greater than zero', {
      field,
      constraints: {
        amount: 'Value must be greater than zero'
      }
    });
  }

  return normalizedFraction ? `${normalizedInteger}.${normalizedFraction}` : normalizedInteger;
}

export const formatAmountForResponse = (value: string): string =>
  normalizeAmountString(value);
