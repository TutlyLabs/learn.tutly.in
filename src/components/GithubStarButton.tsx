import { FaGithub, FaStar } from "react-icons/fa";

import { Button } from "@/components/ui/button";

export function GithubStarButton() {
  return (
    <a href="https://github.com/TutlyLabs/Tutly/" target="_blank" rel="noopener noreferrer">
      <Button
        variant="ghost"
        className="flex items-center gap-2 bg-white text-black hover:scale-105 hover:shadow-lg bg-gray-100"
      >
        <FaGithub className="h-4 w-4" />
        <span>Star on GitHub</span>
        <FaStar className="h-4 w-4 text-yellow-500 fill-yellow-400" />
      </Button>
    </a>
  );
}
