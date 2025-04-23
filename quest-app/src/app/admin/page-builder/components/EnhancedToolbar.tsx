// components/EnhancedToolbar.tsx
"use client";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  COMMAND_PRIORITY_NORMAL,
  createCommand,
} from "lexical";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
} from "lexical";
import { useState, useRef } from "react";
import { $createImageNode } from "./nodes/ImageNode";

// Define custom commands
export const INSERT_IMAGE_COMMAND = createCommand("INSERT_IMAGE_COMMAND");

export const EnhancedToolbar = () => {
  const [editor] = useLexicalComposerContext();
  const [insertDropdown, setInsertDropdown] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxImageWidth = "100%"; // Hard-coded image width constraint

  // Function to handle clearing formatting
  const handleClearFormatting = () => {
    editor.update(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        // Check and toggle each format only if it's active
        const formats = [
          "bold",
          "italic",
          "underline",
          "strikethrough",
        ] as const;

        formats.forEach((format) => {
          if (selection.hasFormat(format)) {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
          }
        });
      }
    });
  };

  // Register image insertion command
  editor.registerCommand(
    INSERT_IMAGE_COMMAND,
    (payload: { src: string; altText: string }) => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return false;

      editor.update(() => {
        const imageNode = $createImageNode(
          payload.src,
          payload.altText,
          maxImageWidth
        );
        const paragraph = $createParagraphNode();
        paragraph.append(imageNode);
        selection.insertNodes([paragraph]);
      });

      return true;
    },
    COMMAND_PRIORITY_NORMAL
  );

  // Function to handle inserting a link
  const handleInsertLink = () => {
    // Get the current selection
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setLinkText(selection.toString());
      setShowLinkDialog(true);
    } else {
      setLinkText("");
      setShowLinkDialog(true);
    }
    setInsertDropdown(false);
  };

  // Function to apply the link
  const applyLink = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // If there's no text selected and the user provided link text, insert it
        if (selection.isCollapsed() && linkText) {
          selection.insertText(linkText);
        }
        // Apply link to the selection
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
      }
    });
    setShowLinkDialog(false);
    setLinkUrl("");
    setLinkText("");
  };

  // Function to cancel link insertion
  const cancelLink = () => {
    setShowLinkDialog(false);
    setLinkUrl("");
    setLinkText("");
  };

  // Function to handle inserting an image
  const handleInsertImage = () => {
    // Trigger file input click
    fileInputRef.current?.click();
    setInsertDropdown(false);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    // Check if the file is an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    // Create a URL for the selected file
    const imageUrl = URL.createObjectURL(file);

    // Insert the image into the editor
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
      src: imageUrl,
      altText: file.name,
    });

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;

    if (!files || files.length === 0) return;

    const file = files[0];
    // Check if the file is an image
    if (!file.type.startsWith("image/")) {
      alert("Please drop an image file.");
      return;
    }

    // Create a URL for the dropped file
    const imageUrl = URL.createObjectURL(file);

    // Insert the image into the editor
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
      src: imageUrl,
      altText: file.name,
    });
  };

  // Drag over handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <div
        className="flex items-center p-2 border-b bg-gray-50"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex gap-2 mr-4">
          <button
            className="p-2 hover:bg-gray-200 rounded"
            onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
            title="Undo"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 7v6h6"></path>
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
            </svg>
          </button>
          <button
            className="p-2 hover:bg-gray-200 rounded"
            onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
            title="Redo"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 7v6h-6"></path>
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path>
            </svg>
          </button>
        </div>

        {/* Basic formatting */}
        <div className="flex gap-2 mr-4">
          <button
            className="p-2 hover:bg-gray-200 rounded font-bold"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
            title="Bold"
          >
            B
          </button>
          <button
            className="p-2 hover:bg-gray-200 rounded italic"
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
            }
            title="Italic"
          >
            I
          </button>
          <button
            className="p-2 hover:bg-gray-200 rounded underline"
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
            }
            title="Underline"
          >
            U
          </button>
        </div>

        <div className="relative mr-4">
          <button
            className="flex items-center p-2 hover:bg-gray-200 rounded"
            onClick={() => setInsertDropdown(!insertDropdown)}
            title="Insert"
          >
            <span>Insert</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-1"
            >
              <path d="m6 9 6 6 6-6"></path>
            </svg>
          </button>
          {insertDropdown && (
            <div className="absolute top-full left-0 bg-white shadow-lg rounded z-10 w-40">
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={handleInsertImage}
              >
                Image
              </button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={handleInsertLink}
              >
                Link
              </button>
            </div>
          )}
        </div>

        {/* Clear formatting */}
        <div className="ml-auto flex gap-2">
          <button
            className="p-2 hover:bg-gray-200 rounded"
            title="Clear Formatting"
            onClick={handleClearFormatting}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
              <path d="m2 2 20 20"></path>
            </svg>
          </button>
        </div>

        {/* Hidden file input for image upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-medium mb-4">Insert Link</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Link URL</label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Link Text (optional)
              </label>
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Display text for the link"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelLink}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={applyLink}
                className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded"
                disabled={!linkUrl}
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
