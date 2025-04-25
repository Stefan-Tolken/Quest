// app/admin/page-builder/types.ts
/**
 * Defines types used in the page builder
 */
export type ComponentType = "heading" | "paragraph" | "image";

export interface ComponentData {
  id: string;
  type: ComponentType;
  content?: string | ImageContent;
  // Added editMode for inline editing
  editMode?: boolean;
}

export interface PointOfInterest {
  id: string;
  x: number; // Percentage-based coordinates
  y: number;
  text: string;
}

export interface ImageContent {
  url: string;
  points: Array<{
    id: string;
    x: number;
    y: number;
    text: string;
  }>;
}
