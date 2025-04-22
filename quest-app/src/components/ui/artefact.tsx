import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface ArtefactProps {
  id: string;
  name: string;
  description: string;
  isCenter: boolean;
}

export const Artefact = ({ id, name, description, isCenter }: ArtefactProps) => {
  return (
    <li className="w-full h-full flex flex-col">
      <Link href={`/client/artefact/${id}`} className="w-full h-full flex flex-col">
        <Card className="w-full h-full flex flex-col overflow-hidden p-0 gap-0 border-none">
        {isCenter && (
          <div className="relative w-full h-48">
            <Image
              src={`https://picsum.photos/seed/${id}/200/300`}
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
      </Link>
    </li>
  );
};