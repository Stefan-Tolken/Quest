// components/RichTextEditor.tsx
"use client";
import { useEffect } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  CLEAR_EDITOR_COMMAND,
} from "lexical";
import { EnhancedToolbar } from "./EnhancedToolbar";
import { ImageNode } from "./nodes/ImageNode";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";

// Add this ErrorBoundary component
function LexicalErrorBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

const theme = {
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
  },
};

const initialConfig = {
  namespace: "Editor",
  theme,
  nodes: [
    HeadingNode,
    QuoteNode,
    ListItemNode,
    ListNode,
    LinkNode,
    AutoLinkNode,
    ImageNode,
  ],
  onError: (error: Error) => console.error(error),
};

export const RichTextEditor = ({
  initialValue,
  initialHtml = "",
  onChange,
}: {
  initialValue: string;
  initialHtml?: string;
  onChange: (value: string, html: string) => void;
}) => {
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="border rounded-lg overflow-hidden bg-white">
        <EnhancedToolbar />
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="p-4 min-h-[200px] focus:outline-none" />
          }
          placeholder={
            <div className="absolute top-4 left-4 text-gray-400">
              Enter some rich text...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <UpdatePlugin
          onChange={onChange}
          initialValue={initialValue}
          initialHtml={initialHtml}
        />
      </div>
    </LexicalComposer>
  );
};

const UpdatePlugin = ({
  onChange,
  initialValue,
  initialHtml,
}: {
  onChange: (value: string, html: string) => void;
  initialValue: string;
  initialHtml: string;
}) => {
  const [editor] = useLexicalComposerContext();

  // Initialize editor with content if provided
  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();

      // Clear existing content
      root.clear();

      if (initialHtml) {
        // Try to import HTML content
        try {
          const parser = new DOMParser();
          const dom = parser.parseFromString(initialHtml, "text/html");
          const nodes = $generateNodesFromDOM(editor, dom);
          $getRoot().select();
          root.append(...nodes);
        } catch (error) {
          console.error("Error importing HTML:", error);
          // Fallback to plain text if HTML import fails
          if (initialValue) {
            const paragraph = $createParagraphNode();
            const textNode = $createTextNode(initialValue);
            paragraph.append(textNode);
            root.append(paragraph);
          }
        }
      } else if (initialValue) {
        // If no HTML but there's text, create paragraph with text
        const paragraph = $createParagraphNode();
        const textNode = $createTextNode(initialValue);
        paragraph.append(textNode);
        root.append(paragraph);
      }
    });
  }, [editor, initialValue, initialHtml]);

  // Listen for updates and generate both text and HTML
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(async () => {
        const root = $getRoot();
        const textContent = root.getTextContent();

        // Generate HTML from editor content
        const htmlContent = $generateHtmlFromNodes(editor, null);

        onChange(textContent, htmlContent);
      });
    });
  }, [editor, onChange]);

  return null;
};
