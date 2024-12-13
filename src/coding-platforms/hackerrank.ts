const _HACKERRANK_BASE_URL = "https://www.hackerrank.com/rest/";

export async function isHandleValid(handle: string): Promise<[boolean, Error | null]> {
  try {
    const response = await fetch(`${_HACKERRANK_BASE_URL}hackers/${handle}`);
    const data = await response.json();
    return [data.status, null];
  } catch (err) {
    return [false, new Error("ErrorFetchFailed")];
  }
}

export async function getScore(handle: string): Promise<{
  score: string;
  problemCount: number;
}> {
  try {
    const response = await fetch(`${_HACKERRANK_BASE_URL}hackers/${handle}/scores_elo`, {
      headers: { Accept: "application/json" },
    });
    const data = await response.json();

    let score = BigInt(0);
    let done = false;

    for (const track of data) {
      if (track.slug === "algorithms" || track.slug === "data-structures") {
        score += BigInt(Math.floor(track.practice.score));
        if (done) break;
        done = true;
      }
    }

    return {
      score: score.toString(),
      problemCount: 0,
    };
  } catch (err) {
    throw new Error("ErrorFetchFailed");
  }
}

export async function getHackerrankSubmissions(
  username: string,
  cursor: string = ""
): Promise<any> {
  const perPage = 11;
  try {
    const response = await fetch(
      `${_HACKERRANK_BASE_URL}hackers/${username}/recent_challenges?limit=${perPage}&cursor=${cursor}`
    );
    const data = await response.json();

    if (data.error) {
      throw new Error("ErrorUserNotFound");
    }

    data.last_page = data.models.length < perPage;
    return data;
  } catch (err) {
    throw new Error("ErrorFetchFailed");
  }
}

export async function getHackerrankContestProblems(
  contest: string,
  page: number,
  limit: number
): Promise<any> {
  const offset = page * limit;
  try {
    const response = await fetch(
      `${_HACKERRANK_BASE_URL}contests/master/tracks/${contest}/challenges?offset=${offset}&limit=${limit}`
    );
    return await response.json();
  } catch (err) {
    throw new Error("ErrorFetchFailed");
  }
}

export async function getHackerrankLeaderBoard(
  contest: string,
  page: number,
  limit: number
): Promise<any> {
  const offset = page * limit;
  try {
    const response = await fetch(
      `${_HACKERRANK_BASE_URL}contests/${contest}/leaderboard?offset=${offset}&limit=${limit}`
    );
    return await response.json();
  } catch (err) {
    throw new Error("ErrorFetchFailed");
  }
}
