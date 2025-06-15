"use client";

import { useState } from "react";

interface SubHeadingProps {
  content: string;
  onUpdate: (content: string) => void;
}

export const SubHeadingComponent = ({ content, onUpdate }: SubHeadingProps) => {
  const [localContent, setLocalContent] = useState(content);

  return (
    <input
      value={localContent}
      onChange={(e) => setLocalContent(e.target.value)}
      onBlur={() => onUpdate(localContent)}
      className="text-1xl font-bold w-full border-b focus:outline-none"
      placeholder="Enter heading..."
    />
  );
};