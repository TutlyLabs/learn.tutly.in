import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";

import { cn } from "@/lib/utils";

import { CheckListPlugin } from "./plugins/CheckListPlugin";
import ListMaxIndentLevelPlugin from "./plugins/ListMaxIndentLevelPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin";

const Placeholder = () => {
  return <div className="absolute top-3 left-3 text-muted-foreground">Enter some text...</div>;
};

export default function RichTextEditor({
  onChange,
  initialValue,
  height = "300px",
}: {
  onChange: (value: string) => void;
  initialValue?: string;
  height?: string;
}) {
  const editorConfig = {
    namespace: "editor",
    theme: {
      ltr: "text-left",
      rtl: "text-right",
      paragraph: "mb-2",
      quote: "border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic my-2",
      heading: {
        h1: "text-3xl font-bold mb-4",
        h2: "text-2xl font-bold mb-3",
        h3: "text-xl font-bold mb-3",
        h4: "text-lg font-bold mb-2",
        h5: "text-base font-bold mb-2",
      },
      list: {
        nested: {
          listitem: "list-none",
        },
        ol: "list-decimal list-inside mb-2",
        ul: "list-disc list-inside mb-2",
        listitem: "ml-2 mb-1",
      },
      link: "text-blue-500 hover:underline",
      text: {
        bold: "font-bold",
        italic: "italic",
        underline: "underline",
        strikethrough: "line-through",
        underlineStrikethrough: "underline line-through",
        code: "bg-gray-200 dark:bg-gray-700 rounded px-1.5 py-0.5 font-mono text-sm",
      },
      code: "block bg-background border rounded p-4 font-mono text-sm my-2 overflow-x-auto relative",
      codeHighlight: {
        "code-language":
          "absolute top-3 right-3 text-xs text-muted-foreground bg-background px-2 py-1 rounded",
      },
    },
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode,
    ],
    onError(error: Error) {
      throw error;
    },
    editorState: () => $convertFromMarkdownString(initialValue || "", TRANSFORMERS),
  };
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="flex flex-col w-full">
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={cn(
                  "min-h-[200px] p-3 outline-none",
                  "overflow-y-auto rounded-b-md border border-t-0",
                  "bg-background text-foreground",
                  "focus:outline-none",
                  height
                )}
              />
            }
            placeholder={<Placeholder />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <ListPlugin />
          <CheckListPlugin />
          <ListMaxIndentLevelPlugin maxDepth={7} />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <OnChangePlugin
            onChange={(editorState) => {
              editorState.read(() => {
                const markdown = $convertToMarkdownString(TRANSFORMERS);
                onChange(markdown);
              });
            }}
          />
        </div>
      </div>
    </LexicalComposer>
  );
}
