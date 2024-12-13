import {
  getScore as getCodechefScore,
  isHandleValid as isCodechefValid,
} from "../coding-platforms/codechef";
import {
  getScore as getCodeforcesScore,
  isHandleValid as isCodeforcesValid,
} from "../coding-platforms/codeforces";
import { isHandleValid as isGithubValid } from "../coding-platforms/github";
import {
  getScore as getHackerrankScore,
  isHandleValid as isHackerrankValid,
} from "../coding-platforms/hackerrank";
import {
  getScore as getInterviewbitScore,
  isHandleValid as isInterviewbitValid,
} from "../coding-platforms/interviewbit";
import {
  getScore as getLeetcodeScore,
  isHandleValid as isLeetcodeValid,
} from "../coding-platforms/leetcode";

export interface ValidationResult {
  valid: boolean;
  invalidFields: string[];
}

export interface PlatformScore {
  score: string;
  problemCount: number;
  contestCount?: number;
  currentRating?: number;
}

export interface PlatformScores {
  [platform: string]: PlatformScore | null | number | { [platform: string]: number };
  totalScore: number;
  percentages: { [platform: string]: number };
}

export async function validatePlatformHandles(
  handles: Record<string, string>
): Promise<ValidationResult> {
  const invalidHandles: string[] = [];
  const validationPromises: Promise<void>[] = [];

  for (const [platform, handle] of Object.entries(handles)) {
    if (!handle) continue;

    const validationPromise = (async () => {
      let isValid: boolean = false;
      let validationError: Error | null = null;

      switch (platform) {
        case "github":
          [isValid, validationError] = (await isGithubValid(handle)) as unknown as [
            boolean,
            Error | null,
          ];
          break;
        case "codechef":
          [isValid, validationError] = await isCodechefValid(handle);
          break;
        case "codeforces":
          [isValid, validationError] = await isCodeforcesValid(handle);
          break;
        case "hackerrank":
          [isValid, validationError] = await isHackerrankValid(handle);
          break;
        case "interviewbit":
          [isValid, validationError] = await isInterviewbitValid(handle);
          break;
        case "leetcode":
          [isValid, validationError] = await isLeetcodeValid(handle);
          break;
      }

      if (!isValid || validationError) {
        invalidHandles.push(platform);
      }
    })();

    validationPromises.push(validationPromise);
  }

  await Promise.all(validationPromises);

  return {
    valid: invalidHandles.length === 0,
    invalidFields: invalidHandles,
  };
}

export async function getPlatformScores(handles: Record<string, string>): Promise<PlatformScores> {
  const scores = {
    totalScore: 0,
    percentages: {},
    codechef: null,
    codeforces: null,
    hackerrank: null,
    interviewbit: null,
    leetcode: null,
  } as PlatformScores;

  const scorePromises = Object.entries(handles).map(async ([platform, handle]) => {
    if (!handle) return;

    try {
      let score: PlatformScore | null = null;

      switch (platform) {
        case "codechef":
          score = await getCodechefScore(handle);
          break;
        case "codeforces":
          score = await getCodeforcesScore(handle);
          break;
        case "hackerrank":
          score = await getHackerrankScore(handle);
          break;
        case "interviewbit":
          score = await getInterviewbitScore(handle);
          break;
        case "leetcode":
          score = await getLeetcodeScore(handle);
          break;
      }

      if (score) {
        scores[platform] = score;
        scores.totalScore += parseInt(score.score);
      }
    } catch (error) {
      console.error(`Error fetching score for ${platform}:`, error);
      scores[platform] = null;
    }
  });

  await Promise.all(scorePromises);

  Object.entries(scores).forEach(([platform, score]) => {
    if (
      platform !== "totalScore" &&
      platform !== "percentages" &&
      score &&
      typeof score !== "number" &&
      "score" in score
    ) {
      scores.percentages[platform] = Number(
        ((parseInt(score.score as string) / scores.totalScore) * 100).toFixed(2)
      );
    }
  });

  return scores;
}
