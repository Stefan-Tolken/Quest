// app/admin/page-builder/components/ImageComponent.tsx
"use client";

interface ImageProps {
  onUpdate: (content: string) => void;
}

export const ImageComponent = ({ onUpdate }: ImageProps) => {
  return (
    <div className="border-dashed border-2 p-4 rounded">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              onUpdate(event.target?.result as string);
            };
            reader.readAsDataURL(file);
          }
        }}
        className="w-full"
      />
    </div>
  );
};