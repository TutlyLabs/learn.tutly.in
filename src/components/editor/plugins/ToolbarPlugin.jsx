// @ts-nocheck
import {
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createHeadingNode, $createQuoteNode, $isHeadingNode } from "@lexical/rich-text";
import { $isAtNodeEnd, $isParentElementRTL, $wrapNodes } from "@lexical/selection";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import {
  BoldIcon,
  CheckSquareIcon,
  Heading1Icon,
  Heading2Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  RedoIcon,
  StrikethroughIcon,
  TextIcon,
  UnderlineIcon,
  UndoIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";

const LowPriority = 1;

const blockTypeToBlockName = {
  h1: "Large Heading",
  h2: "Small Heading",
  h3: "Heading",
  h4: "Heading",
  h5: "Heading",
  ol: "Numbered List",
  paragraph: "Normal",
  quote: "Quote",
  ul: "Bulleted List",
  check: "Check List",
};

function Divider() {
  return <div className="h-5 w-[1px] bg-border mx-1" />;
}

function Select({ onChange, className, options, value }) {
  return (
    <select className={className} onChange={onChange} value={value}>
      <option hidden={true} value="" />
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function getSelectedNode(selection) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
  }
}

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] = useState("paragraph");
  const [selectedElementKey, setSelectedElementKey] = useState(null);
  const [isRTL, setIsRTL] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root" ? anchorNode : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);
      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type = parentList ? parentList.getTag() : element.getTag();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element) ? element.getTag() : element.getType();
          setBlockType(type);
        }
      }
      // Update text format
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsRTL($isParentElementRTL(selection));
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          updateToolbar();
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        LowPriority
      )
    );
  }, [editor, updateToolbar]);

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $wrapNodes(selection, () => $createParagraphNode());
      }
    });
  };

  const formatLargeHeading = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $wrapNodes(selection, () => $createHeadingNode("h1"));
      }
    });
  };

  const formatSmallHeading = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $wrapNodes(selection, () => $createHeadingNode("h2"));
      }
    });
  };

  const formatBulletList = () => {
    if (blockType !== "ul") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== "ol") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND);
    }
  };

  const formatCheckList = () => {
    if (blockType !== "check") {
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND);
    }
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $wrapNodes(selection, () => $createQuoteNode());
      }
    });
  };

  return (
    <div className="flex items-center p-1 gap-1 border rounded-lg bg-background" ref={toolbarRef}>
      <Button
        disabled={!canUndo}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND)}
        variant="ghost"
        size="icon"
      >
        <UndoIcon className="h-4 w-4" />
      </Button>

      <Button
        disabled={!canRedo}
        onClick={() => editor.dispatchCommand(REDO_COMMAND)}
        variant="ghost"
        size="icon"
      >
        <RedoIcon className="h-4 w-4" />
      </Button>

      <Divider />

      <Button
        onClick={formatLargeHeading}
        variant={blockType === "h1" ? "secondary" : "ghost"}
        size="icon"
      >
        <Heading1Icon className="h-4 w-4" />
      </Button>

      <Button
        onClick={formatSmallHeading}
        variant={blockType === "h2" ? "secondary" : "ghost"}
        size="icon"
      >
        <Heading2Icon className="h-4 w-4" />
      </Button>

      <Button
        onClick={formatBulletList}
        variant={blockType === "ul" ? "secondary" : "ghost"}
        size="icon"
      >
        <ListIcon className="h-4 w-4" />
      </Button>

      <Button
        onClick={formatNumberedList}
        variant={blockType === "ol" ? "secondary" : "ghost"}
        size="icon"
      >
        <ListOrderedIcon className="h-4 w-4" />
      </Button>
      {/* 
      <Button
        onClick={formatCheckList}
        variant={blockType === "check" ? "secondary" : "ghost"}
        size="icon"
      >
        <CheckSquareIcon className="h-4 w-4" />
      </Button> */}

      <Button
        onClick={formatQuote}
        variant={blockType === "quote" ? "secondary" : "ghost"}
        size="icon"
      >
        <QuoteIcon className="h-4 w-4" />
      </Button>

      <Divider />

      <Button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        variant={isBold ? "secondary" : "ghost"}
        size="icon"
      >
        <BoldIcon className="h-4 w-4" />
      </Button>

      <Button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        variant={isItalic ? "secondary" : "ghost"}
        size="icon"
      >
        <ItalicIcon className="h-4 w-4" />
      </Button>

      <Button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        variant={isUnderline ? "secondary" : "ghost"}
        size="icon"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>

      <Button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
        variant={isStrikethrough ? "secondary" : "ghost"}
        size="icon"
      >
        <StrikethroughIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
