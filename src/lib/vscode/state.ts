import { Files, Search, Settings, LucideProps } from 'lucide-react';
import { FaTerminal } from 'react-icons/fa';
export interface FileData {
  content: string;
  language?: string;
}

export interface VSCodeState {
  files: Record<string, FileData>;
  config: Record<string, any>;
}

const sidebarItemMap = {
  instructions: {
    name: 'Instructions',
    icon: Files,
  },
  explorer: {
    name: 'Explorer',
    icon: Files,
  },
  search: {
    name: 'Search',
    icon: Search,
  },
  settings: {
    name: 'Settings',
    icon: Settings,
  }
}

export type SideBarItemType = keyof typeof sidebarItemMap;

export const initialState: VSCodeState = {
  files: {
    "/sample-folder/file.ts": {
      content: "console.log('Hello from TypeScript');",
      language: "typescript"
    },
    "/sample-folder/file.js": {
      content: "console.log('Hello from JavaScript');",
      language: "javascript"
    }
  },
  config: {
    terminals: [
      'cd client && yarn && yarn start',
      'cd server && yarn && yarn dev',
      'echo "We\'re ready"',
    ],
    tabs: ['README.md'],
    runButton: 'clear && node $$file',
    browserLink: 'https://wikipedia.org',
    view: ['terminal', 'editor', 'browser'],
    statusBarItems: ["search", "explorer", "instructions", "settings"],
    orgIcon: {
      name: "Tutly",
      icon: FaTerminal,
      href: "https://tutly.ai"
    },
  }
};
