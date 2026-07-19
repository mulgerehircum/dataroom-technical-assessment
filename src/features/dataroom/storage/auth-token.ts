type TokenGetter = () => Promise<string | null>;

let currentTokenGetter: TokenGetter = async () => null;

export function setTokenGetter(getter: TokenGetter): void {
  currentTokenGetter = getter;
}

export function getAuthToken(): Promise<string | null> {
  return currentTokenGetter();
}
