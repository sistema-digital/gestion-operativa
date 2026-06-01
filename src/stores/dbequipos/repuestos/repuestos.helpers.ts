export type RepuestoMultiValue = string | string[] | null | undefined;

const normalizeTextValue = (value: string) => {
  return value.trim().replace(/\s+/g, ' ');
};

export const ensureStringArray = (value: RepuestoMultiValue): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeTextValue(item))
      .filter(Boolean);
  }

  const cleanValue = typeof value === 'string'
    ? normalizeTextValue(value)
    : '';

  return cleanValue ? [cleanValue] : [];
};

export const normalizeTagValues = (values: string[]): string[] => {
  return values
    .map((item) => normalizeTextValue(item))
    .filter(Boolean)
    .filter((item, index, array) => {
      return array.findIndex((candidate) => {
        return candidate.toLowerCase() === item.toLowerCase();
      }) === index;
    });
};

export const extractUniqueValues = (values: RepuestoMultiValue[]): string[] => {
  return normalizeTagValues(values.flatMap((value) => ensureStringArray(value)))
    .sort((left, right) => left.localeCompare(right));
};

export const formatArrayValue = (value: RepuestoMultiValue, separator = ', ') => {
  return ensureStringArray(value).join(separator);
};

export const matchesMultiValueQuery = (value: RepuestoMultiValue, query: string) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return true;

  return ensureStringArray(value).some((item) => {
    return item.toLowerCase().includes(normalizedQuery);
  });
};
