export const formatDivisionLabel = (value?: string | null): string => {
  const raw = String(value || '').trim();
  const normalized = raw.toUpperCase();

  if (normalized === 'MEN' || normalized === 'MENS') {
    return 'MENS';
  }

  return raw;
};
