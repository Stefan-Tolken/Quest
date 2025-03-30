// app/admin/page-builder/types.ts
/**
 * Defines types used in the page builder
 */
export type ComponentType = "heading" | "paragraph" | "image";

export interface ComponentData {
  id: string;
  type: ComponentType;
  content?: string;
  // Added editMode for inline editing
  editMode?: boolean;
}