const _INTERVIEWBIT_BASE_URL = "https://www.interviewbit.com/v2/";

export async function isHandleValid(handle: string): Promise<[boolean, Error | null]> {
  try {
    const response = await fetch(`${_INTERVIEWBIT_BASE_URL}profile/username?id=${handle}`);
    const data = await response.json();
    return [data.id !== undefined, null];
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "EOF") {
      return [false, new Error("ErrorUserNotFound")];
    }
    return [false, new Error("ErrorFetchFailed")];
  }
}

export async function getScore(handle: string): Promise<{
  score: string;
  problemCount: number;
}> {
  try {
    const problemsSolved = await getInterviewBitProblemsSolved(handle);

    let score = BigInt(0);
    for (const course of problemsSolved.course_problems_solved) {
      score += BigInt(course.total_user_score);
    }

    score /= BigInt(3);

    return {
      score: score.toString(),
      problemCount: problemsSolved.total_problems_solved,
    };
  } catch (err) {
    throw err;
  }
}

export async function getInterviewBitProblemsSolved(handle: string): Promise<any> {
  try {
    const response = await fetch(
      `${_INTERVIEWBIT_BASE_URL}problem_list/problems_solved_overview_count?username=${handle}`
    );
    const data = await response.json();

    if (Object.keys(data).length === 0) {
      throw new Error("ErrorUserNotFound");
    }

    return data;
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "EOF") {
      throw new Error("ErrorUserNotFound");
    }
    throw new Error("ErrorFetchFailed");
  }
}
