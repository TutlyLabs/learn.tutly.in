const _CODEFORCES_API = "https://codeforces.com/api/";

export async function isHandleValid(handle: string): Promise<[boolean, Error | null]> {
  try {
    await getCodeforcesSubmissions(handle, 1, 1);
    return [true, null];
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "ErrorUserNotFound") {
      return [false, null];
    }
    return [false, err as Error];
  }
}

export async function getScore(handle: string): Promise<{
  score: string;
  problemCount: number;
  contestCount: number;
  currentRating: number;
}> {
  const ratingCh: Promise<number> = new Promise(async (resolve, reject) => {
    try {
      const profile = await getCodeforcesProfile(handle);
      if (profile.length === 0) {
        reject(new Error("empty profile returned"));
      } else {
        resolve(profile[0].rating);
      }
    } catch (err) {
      reject(err);
    }
  });

  const submissions = await getCodeforcesSubmissions(handle, 1, 500);
  let score = BigInt(0);
  const visitedProblems = new Map();
  const visitedContests = new Set();

  // Score calculation formula:
  // 1. For each unique solved problem: score += 10
  // 2. If user has participated in at least 3 contests and rating >= 1200:
  //    score += floor((rating - 1200)^2 / 30)

  for (const submission of submissions) {
    if (submission.verdict !== "OK") continue;
    if (visitedProblems.has(submission.problem.name)) continue;

    visitedProblems.set(submission.problem.name, true);
    visitedContests.add(submission.contestId);
    score += BigInt(10); // 10 points for each unique solved problem
  }

  let currentRating = 0;
  if (visitedContests.size >= 3) {
    try {
      currentRating = await ratingCh;
      if (currentRating >= 800) {
        score += BigInt(Math.floor(Math.pow(currentRating - 800, 2) / 30));
      }
    } catch (err) {
      console.error(`Error fetching Codeforces rating for handle ${handle}:`, err);
    }
  }

  return {
    score: score.toString(),
    problemCount: visitedProblems.size,
    contestCount: visitedContests.size,
    currentRating: currentRating,
  };
}

async function getCodeforcesProfile(handle: string) {
  const retryLimit = 5;
  let retries = retryLimit;

  while (retries > 0) {
    try {
      const res = await fetch(`${_CODEFORCES_API}user.info?handles=${handle}`);
      const data = await res.json();

      if (data.status === "OK") {
        return data.result;
      } else if (data.comment === "Call limit exceeded") {
        retries--;
        if (retries === 0) throw new Error("ErrorFetchFailed");
      } else {
        console.error(`Failed to get Codeforces profile for handles ${handle}:`, data.comment);
        throw new Error("ErrorUserNotFound");
      }
    } catch (err) {
      if (retries === 0) throw new Error("ErrorFetchFailed");
    }
  }
}

async function getCodeforcesSubmissions(
  handle: string,
  from: number,
  count: number
): Promise<any[]> {
  try {
    const res = await fetch(
      `${_CODEFORCES_API}user.status?handle=${handle}&from=${from}&count=${count}`
    );
    const data = await res.json();

    if (data.status !== "OK") {
      throw new Error("ErrorFetchFailed");
    }
    return data.result;
  } catch (err) {
    throw new Error("ErrorFetchFailed");
  }
}
