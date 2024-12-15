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
  ImageIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  RedoIcon,
  StrikethroughIcon,
  TextIcon,
  UnderlineIcon,
  UndoIcon,
  UploadIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFileUpload } from "@/components/useFileUpload";

import { INSERT_IMAGE_COMMAND } from "./ImagePlugin";

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

export function FillURL() {
  const srcfile = prompt("Enter the URL of the image:", "");
  return srcfile;
}

export default function ToolbarPlugin({ fileUploadOptions, allowUpload }) {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const fileInputRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] = useState("paragraph");
  const [selectedElementKey, setSelectedElementKey] = useState(null);
  const [isRTL, setIsRTL] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { fileType, onUpload, associatingId, allowedExtensions } = fileUploadOptions || {};

  const { uploadFile } = useFileUpload({
    fileType: fileType,
    allowedExtensions: allowedExtensions,
    onUpload: async (file) => {
      if (!file || !file.publicUrl) return;
      try {
        if (onUpload) {
          await onUpload(file);
        }
        editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
          src: file.publicUrl,
          altText: file.name,
        });
        toast.success("File uploaded successfully");
      } catch (error) {
        toast.error("Failed to upload file");
      }
    },
  });

  const handleUpload = async (e) => {
    if (!e.target.files?.length) return;
    setIsUploading(true);

    try {
      const file = e.target.files[0];
      if (!file) return;
      await uploadFile(file, associatingId);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const insertImage = (payload) => {
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
  };

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
        onClick={(e) => {
          e.preventDefault();
          editor.dispatchCommand(UNDO_COMMAND);
        }}
        variant="ghost"
        size="icon"
      >
        <UndoIcon className="h-4 w-4" />
      </Button>

      <Button
        disabled={!canRedo}
        onClick={(e) => {
          e.preventDefault();
          editor.dispatchCommand(REDO_COMMAND);
        }}
        variant="ghost"
        size="icon"
      >
        <RedoIcon className="h-4 w-4" />
      </Button>

      <Divider />

      <Button
        onClick={(e) => {
          e.preventDefault();
          formatLargeHeading();
        }}
        variant={blockType === "h1" ? "secondary" : "ghost"}
        size="icon"
      >
        <Heading1Icon className="h-4 w-4" />
      </Button>

      <Button
        onClick={(e) => {
          e.preventDefault();
          formatSmallHeading();
        }}
        variant={blockType === "h2" ? "secondary" : "ghost"}
        size="icon"
      >
        <Heading2Icon className="h-4 w-4" />
      </Button>

      <Button
        onClick={(e) => {
          e.preventDefault();
          formatBulletList();
        }}
        variant={blockType === "ul" ? "secondary" : "ghost"}
        size="icon"
      >
        <ListIcon className="h-4 w-4" />
      </Button>

      <Button
        onClick={(e) => {
          e.preventDefault();
          formatNumberedList();
        }}
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
        onClick={(e) => {
          e.preventDefault();
          formatQuote();
        }}
        variant={blockType === "quote" ? "secondary" : "ghost"}
        size="icon"
      >
        <QuoteIcon className="h-4 w-4" />
      </Button>

      <Divider />

      <Button
        onClick={(e) => {
          e.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        }}
        variant={isBold ? "secondary" : "ghost"}
        size="icon"
      >
        <BoldIcon className="h-4 w-4" />
      </Button>

      <Button
        onClick={(e) => {
          e.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        }}
        variant={isItalic ? "secondary" : "ghost"}
        size="icon"
      >
        <ItalicIcon className="h-4 w-4" />
      </Button>

      <Button
        onClick={(e) => {
          e.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        }}
        variant={isUnderline ? "secondary" : "ghost"}
        size="icon"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>

      <Button
        onClick={(e) => {
          e.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
        }}
        variant={isStrikethrough ? "secondary" : "ghost"}
        size="icon"
      >
        <StrikethroughIcon className="h-4 w-4" />
      </Button>

      {allowUpload && (
        <>
          <Divider />
          <Button
            onClick={(e) => {
              e.preventDefault();
              fileInputRef.current?.click();
            }}
            variant="ghost"
            size="icon"
            disabled={isUploading}
          >
            <UploadIcon className="h-4 w-4" />
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
            accept="image/*"
          />
          <Button
            onClick={(e) => {
              e.preventDefault();
              const url = FillURL();
              if (url) {
                insertImage({
                  src: url,
                  altText: "URL image",
                });
              }
            }}
            variant="ghost"
            size="icon"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
