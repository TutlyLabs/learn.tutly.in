import { FaTerminal } from 'react-icons/fa';
export interface FileData {
  content: string;
  language?: string;
}

export interface VSCodeState {
  files: Record<string, FileData>;
  config: {
    terminals: string[];
    defaultOpenFiles: string[];
    runButton: string;
    browserLink: string;
    view: string[];
    statusBarItems: ("instructions" | "explorer" | "search" | "settings")[];
    orgIcon: {
      name: string;
      icon: any;
      href: string;
    };
    showPreview: boolean;
    showTerminal: boolean;
    previewUrl: string;
  }
}

export const initialState: VSCodeState = {
  files: {
    "/file.ts": {
      content: "console.log('Hello from TypeScript');",
      language: "typescript"
    },
    "/file.js": {
      content: "console.log('Hello from JavaScript');",
      language: "javascript"
    },
    "/folder1/file1.txt": {
      content: "This is a text file in folder1.",
      language: "plaintext"
    },
    "/folder1/subfolder1/file2.txt": {
      content: "This is a text file in subfolder1.",
      language: "plaintext"
    },
    "/folder2/file3.py": {
      content: "print('Hello from Python')",
      language: "python"
    },
    "/folder2/subfolder2/file4.py": {
      content: "print('Hello from Python in subfolder2')",
      language: "python"
    }
  },
  config: {
    terminals: [
      'cd client && yarn && yarn start',
      'cd server && yarn && yarn dev',
      'echo "We\'re ready"',
    ],
    defaultOpenFiles: ['/file.ts', "/folder1/file1.txt"],
    runButton: 'clear && node $$file',
    browserLink: 'https://wikipedia.org',
    view: ['terminal', 'editor', 'browser'],
    statusBarItems: ["instructions", "explorer", "search", "settings"],
    orgIcon: {
      name: "Tutly",
      icon: FaTerminal,
      href: "https://tutly.ai"
    },
    previewUrl: "https://google.com",
    showPreview: false,
    showTerminal: false,
  }
};

export const fetchPlaygroundState = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return initialState;
};