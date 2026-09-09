/** Resolve section assets inside the independently hosted example. */
export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/u, "");

export function withBasePath(path: `/${string}`): string {
  return `${BASE_PATH}${path}`;
}
