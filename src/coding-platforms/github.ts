const _GITHUB_URL = "https://api.github.com/users/";

export const isHandleValid = async (handle: string) => {
  try {
    const response = await fetch(`${_GITHUB_URL}${handle}`);
    return response.ok;
  } catch {
    return false;
  }
};
