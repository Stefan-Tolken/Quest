// app/admin/page-builder/pageComponent.tsx
"use client";
import { ComponentData } from "./types";
import { 
  HeadingComponent,
  ParagraphComponent,
  ImageComponent
} from "./components";

interface PageComponentProps {
  component: ComponentData;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
  dragAttributes?: any;
  dragListeners?: any;
}

export const PageComponent = ({
  component,
  onDelete,
  onUpdate,
  dragAttributes,
  dragListeners,
}: PageComponentProps) => {
  const handleUpdate = (content: string) => onUpdate(component.id, content);

  return (
    <div className="group relative bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="text-red-500 hover:text-red-700"
          onClick={() => onDelete(component.id)}
        >
          Delete
        </button>
        <div
          className="cursor-grab text-gray-400 hover:text-gray-600"
          {...dragAttributes}
          {...dragListeners}
        >
          ⠿
        </div>
      </div>

      {component.type === "heading" && (
        <HeadingComponent
          content={component.content || ""}
          onUpdate={handleUpdate}
        />
      )}

      {component.type === "paragraph" && (
        <ParagraphComponent
          content={component.content || ""}
          onUpdate={handleUpdate}
        />
      )}

      {component.type === "image" && (
        <ImageComponent onUpdate={handleUpdate} />
      )}
    </div>
  );
};