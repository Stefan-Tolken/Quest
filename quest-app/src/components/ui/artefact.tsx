import Link from "next/link";

interface ArtefactProps {
  id: string;
  name: string;
  description: string;
}

export const Artefact = ({ id, name, description }: ArtefactProps) => {
  return (
    <li className="">
      <Link href={`/client/artefact/${id}`}>
        <div>
          <h2 className="text-lg font-semibold">{name}</h2>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </Link>
    </li>
  );
};