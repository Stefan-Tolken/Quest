// app/admin/page-builder/pageComponent.tsx
"use client";

import { ImageContent } from "./types";
import { ComponentData } from "./types";
import {
  HeadingComponent,
  ParagraphComponent,
  ImageComponent,
} from "./components";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

interface PageComponentProps {
  component: ComponentData;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string | ImageContent) => void;
  dragAttributes?: React.HTMLAttributes<HTMLDivElement>;
  dragListeners?: SyntheticListenerMap;
  onEditPoints: (component: ComponentData) => void;
}

export const PageComponent = ({
  component,
  onDelete,
  onUpdate,
  dragAttributes,
  dragListeners,
  onEditPoints,
}: PageComponentProps) => {
  const handleUpdate = (content: string) => onUpdate(component.id, content);

  return (
    <div className="group relative bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="text-red-500 hover:text-red-700"
          onClick={() => onDelete(component.id)}
          aria-label="Delete component"
        >
          Delete
        </button>
        <div
          className="cursor-grab text-gray-400 hover:text-gray-600"
          {...dragAttributes}
          {...dragListeners}
          aria-label="Drag handle"
        >
          ⠿
        </div>
      </div>

      {component.type === "heading" && (
        <HeadingComponent
          content={component.content as string}
          onUpdate={handleUpdate}
        />
      )}

      {component.type === "paragraph" && (
        <ParagraphComponent
          content={component.content as string}
          onUpdate={handleUpdate}
        />
      )}

      {component.type === "image" && (
        <ImageComponent
          content={
            (component.content as ImageContent) || {
              url: "",
              points: [],
              texts: [],
            }
          }
          onUpdate={(content) => onUpdate(component.id, content)}
          onEditPoints={() => onEditPoints(component)}
        />
      )}
    </div>
  );
};
