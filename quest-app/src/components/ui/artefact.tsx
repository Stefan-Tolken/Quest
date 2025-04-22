import Link from "next/link";

interface ArtefactProps {
  id: string;
  name: string;
  description: string;
}

export const Artefact = ({ id, name, description }: ArtefactProps) => {
  return (
    <li className="bg-gray-100 p-4 rounded">
      <Link href={`/client/artefact/${id}`}>
        <div>
          <h2 className="text-lg font-semibold">{name}</h2>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </Link>
    </li>
  );
};