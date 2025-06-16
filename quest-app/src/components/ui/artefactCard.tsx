import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

interface ArtefactProps {
  id: string;
  name: string;
  artist: string;
  isCenter: boolean;
  isGrid?: boolean;
  image?: string;
}

// Utility function to limit description to 50 words
const truncateDescription = (text: string): string => {
  const words = text.split(/\s+/);
  if (words.length <= 50) return text;
  return words.slice(0, 50).join(' ') + '...';
};

export const ArtefactCard = ({ id, name, artist, isCenter, isGrid = false, image }: ArtefactProps) => {
  // Use provided image or fallback to placeholder
  const imageUrl = image && typeof image === 'string' && image.length > 0
    ? image
    : `/api/placeholder/${id}`;

  const truncatedArtist = truncateDescription(artist);

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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20 flex items-end">
          <CardContent className="p-4 w-full h-full">
            <h2 className="text-xl font-bold text-primary-foreground">{name}</h2>
            <p className="text-sm text-primary-foreground/70 line-clamp-2 mt-1">
              {truncatedArtist}
            </p>
          </CardContent>
        </div>
      </Card>
    </li>
  );
};