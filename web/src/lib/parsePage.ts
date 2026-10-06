const MAX_PAGE = 10_000;

export const parsePage = (value: string | null): number => {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 && page <= MAX_PAGE ? page : 1;
};
