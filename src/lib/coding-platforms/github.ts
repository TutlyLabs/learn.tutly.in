const _GITHUB_URL = "https://api.github.com/users/";

export const isHandleValid = async (handle: string): Promise<[boolean, Error | null]> => {
  try {
    const response = await fetch(`${_GITHUB_URL}${handle}`);
    return [response.ok, null];
  } catch (error) {
    return [false, error as Error];
  }
};
