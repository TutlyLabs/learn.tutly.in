import MDEditor from "@uiw/react-md-editor";
import katex from "katex";
import "katex/dist/katex.css";
import { getCodeString } from "rehype-rewrite";

const MarkdownPreview = ({ content, className }: { content: string; className?: string }) => {
  return (
    <MDEditor.Markdown
      source={content}
      style={{ backgroundColor: "transparent", color: "white" }}
      className={className ?? ""}
      components={{
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
            /^language-katex/.test(className.toLocaleLowerCase())
          ) {
            const html = katex.renderToString(code, {
              throwOnError: false,
            });
            return (
              <code
                style={{ fontSize: "150%", background: "transparent" }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }
          return (
            <code className={String(className)} style={{ background: "transparent" }}>
              {children}
            </code>
          );
        },
      }}
    />
  );
};

export default MarkdownPreview;
