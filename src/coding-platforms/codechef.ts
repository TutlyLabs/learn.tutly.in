import * as cheerio from "cheerio";

const _CODECHEF_BASE_URL = "https://www.codechef.com/";

export async function isHandleValid(handle: string): Promise<[boolean, Error | null]> {
  try {
    const response = await fetch(`${_CODECHEF_BASE_URL}users/${handle}`);
    const html = await response.text();
    const $ = cheerio.load(html);
    const profileContainer = $(".user-profile-container");

    if (profileContainer.length === 0) {
      return [false, null];
    }

    return [true, null];
  } catch (err) {
    return [false, new Error("ErrorFetchFailed")];
  }
}

export async function getScore(handle: string): Promise<{
  score: string;
  problemCount: number;
}> {
  try {
    const rating = await getCodechefRating(handle);
    let score = BigInt(rating.totalProblemsSolved * 10);

    if (rating.contests >= 3) {
      score += BigInt(Math.floor(Math.pow(rating.rating - 1300, 2) / 30));
    }

    return {
      score: score.toString(),
      problemCount: rating.totalProblemsSolved,
    };
  } catch (err) {
    throw err;
  }
}

async function getCodechefRating(handle: string): Promise<{
  rating: number;
  totalProblemsSolved: number;
  contests: number;
}> {
  try {
    const response = await fetch(`${_CODECHEF_BASE_URL}users/${handle}`);
    const html = await response.text();
    const $ = cheerio.load(html);

    const profileContainer = $(".user-profile-container");
    if (profileContainer.length === 0) {
      throw new Error("ErrorUserNotFound");
    }

    const rating = $(".rating-number").text().replace("?", "");
    const ratingInt = rating ? parseInt(rating, 10) : -1;

    const totalProblemsSolvedText = $(".problems-solved h3:last-child").text() || "";
    const totalProblemsSolvedInt = totalProblemsSolvedText
      ? parseInt(totalProblemsSolvedText.split(" ").pop() || "0", 10)
      : -1;

    const contests = $(".problems-solved .content").length;

    return {
      rating: ratingInt,
      totalProblemsSolved: totalProblemsSolvedInt,
      contests: contests,
    };
  } catch (err) {
    throw new Error("ErrorFetchFailed");
  }
}
