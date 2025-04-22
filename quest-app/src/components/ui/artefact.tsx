import Link from "next/link";
import Image from "next/image";

interface ArtefactProps {
  id: string;
  name: string;
  description: string;
  isCenter: boolean;
}

export const Artefact = ({ id, name, description, isCenter }: ArtefactProps) => {
  return (
    <li className={`w-full ${isCenter ? 'h-full' : 'h-full'} flex flex-col`}>
      <Link href={`/client/artefact/${id}`} className="w-full h-full flex flex-col">
        <div className={`w-full ${isCenter ? 'flex flex-col gap-2' : 'flex justify-center my-auto'}`}>
          <h2 className={`font-semibold ${isCenter ? 'text-xl' : 'text-lg truncate'}`}>{name}</h2>
          {isCenter ? (
            <>
              <p className="text-sm text-gray-600 mb-2">{description}</p>
              <div className="relative w-full flex-grow mt-2 h-48">
                <Image
                  src={`/artefacts/${id}.jpg`}
                  alt={name}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            </>
          ) : ''}
        </div>
      </Link>
    </li>
  );
}