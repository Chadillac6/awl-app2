const TRUE_VALUES = new Set(['true', '1', 'yes']);
const FALSE_VALUES = new Set(['false', '0', 'no']);

export const parseOptInBoolean = (value, name = 'flag') => {
  if (value === undefined || value === null || value === false) return false;
  if (value === true) return true;

  const normalized = String(value).trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized) || normalized === '') return false;

  throw new Error(`--${name} must be true/false, yes/no, or 1/0`);
};
