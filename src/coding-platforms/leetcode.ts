const _LEETCODE_BASE_URL = "https://leetcode.com/graphql";

export async function isHandleValid(handle: string): Promise<[boolean, Error | null]> {
  const query = `
    query userPublicProfile($username: String!) {
      matchedUser(username: $username) {
        username
      }
    }
  `;

  try {
    const response = await leetcodeGraphQLRequest(query, { username: handle });
    return [response.data.matchedUser !== null, null];
  } catch (err) {
    return [false, new Error("ErrorFetchFailed")];
  }
}

export async function getScore(handle: string): Promise<{
  score: string;
  problemCount: number;
}> {
  const query = `
    query userSessionProgress($username: String!) {
      userContestRanking(username: $username) {
        attendedContestsCount
        rating
      }
      matchedUser(username: $username) {
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `;

  try {
    const response = await leetcodeGraphQLRequest(query, { username: handle });
    const data = response.data;

    if (!data.matchedUser) {
      throw new Error("ErrorUserNotFound");
    }

    const problemsCount = data.matchedUser.submitStats.acSubmissionNum.find(
      (submission: { difficulty: string }) => submission.difficulty === "All"
    ).count;

    let score = BigInt(problemsCount * 50);

    if (data.userContestRanking && data.userContestRanking.attendedContestsCount >= 3) {
      score += BigInt(Math.floor(Math.pow(data.userContestRanking.rating - 1300, 2) / 30));
    }

    return {
      score: score.toString(),
      problemCount: problemsCount,
    };
  } catch (err) {
    throw err;
  }
}

async function leetcodeGraphQLRequest(query: string, variables: Record<string, any>): Promise<any> {
  const response = await fetch(_LEETCODE_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: query,
      variables: variables,
    }),
  });

  if (!response.ok) {
    throw new Error("ErrorFetchFailed");
  }

  return await response.json();
}
