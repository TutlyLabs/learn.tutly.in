import MDEditor from "@uiw/react-md-editor";
import { ContextStore } from "@uiw/react-md-editor";
import katex from "katex";
import "katex/dist/katex.css";
import { ChangeEvent } from "react";
import { getCodeString } from "rehype-rewrite";

export const MarkdownEditor = ({
  value,
  onChange,
  variant = "light",
}: {
  value: string;
  onChange: (
    value?: string,
    event?: ChangeEvent<HTMLTextAreaElement>,
    state?: ContextStore
  ) => void;
  variant?: "light" | "dark" | "transparent";
}) => {
  return (
    <div data-color-mode={variant} className="border rounded-md overflow-hidden">
      <MDEditor
        value={value}
        onChange={onChange}
        height={400}
        preview="live"
        color="transparent"
        previewOptions={{
          components: {
            code: ({ children = [], className, ...props }) => {
              if (typeof children === "string" && /^\$\$(.*)\$\$/.test(children)) {
                const html = katex.renderToString(children.replace(/^\$\$(.*)\$\$/, "$1"), {
                  throwOnError: false,
                });
                return (
                  <code
                    dangerouslySetInnerHTML={{ __html: html }}
                    style={{ background: "transparent" }}
                  />
                );
              }
              const code =
                props.node && props.node.children ? getCodeString(props.node.children) : children;

              if (
                typeof code === "string" &&
                typeof className === "string" &&
                /^language-katex/.test(className.toLowerCase())
              ) {
                const html = katex.renderToString(code, {
                  throwOnError: false,
                });
                return (
                  <code style={{ fontSize: "150%" }} dangerouslySetInnerHTML={{ __html: html }} />
                );
              }
              return <code className={String(className)}>{children}</code>;
            },
          },
        }}
      />
    </div>
  );
};
