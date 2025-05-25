import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

interface ArtefactProps {
  id: string;
  name: string;
  description: string;
  isCenter: boolean;
  isGrid?: boolean;
  image?: string; // Add image prop
}

export const ArtefactCard = ({ id, name, description, isCenter, isGrid = false, image }: ArtefactProps) => {
  // Use provided image or fallback to placeholder
  const imageUrl = image && typeof image === 'string' && image.length > 0
    ? image
    : `/api/placeholder/${id}`;

  if (isGrid) {
    return (
      <li className="w-full h-full flex flex-col">
        <Card className="w-full aspect-square relative overflow-hidden p-0 gap-0 border-none shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="absolute inset-0">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover w-full h-full"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
            <CardContent className="p-4 w-full">
              <h2 className="text-xl font-bold text-white">{name}</h2>
              <p className="text-sm text-white/80 line-clamp-2 mt-1">
                {description}
              </p>
            </CardContent>
          </div>
        </Card>
      </li>
    );
  }

  return (
    <li className="w-full h-full flex flex-col">
      <Card className="w-full h-full flex flex-col overflow-hidden p-0 gap-0 border-none">
        {isCenter && (
          <div className="relative w-full h-48">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover w-full h-full rounded-t-xl"
            />
          </div>
        )}
        <CardContent className="p-4 flex flex-col gap-2 m-auto">
          <h2 className="text-lg font-semibold text-center">{name}</h2>
          {isCenter && (
            <p className="text-sm text-muted-foreground text-center">
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    </li>
  );
};