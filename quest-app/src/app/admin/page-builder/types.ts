export type ComponentType = "heading" | "paragraph" | "image";

export interface ComponentData {
  id: string;
  type: ComponentType;
  content?: string;
}
