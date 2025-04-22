import Link from "next/link";
import { mockArtefacts } from "@/lib/mockData";
import { Artefact } from "./artefact";

export default function ArtefactCarousel() {
    return (
      <div className="relative w-full">
        <div 
          className="no-scrollbar overflow-y-auto h-[600px]" 
          style={{ scrollBehavior: 'smooth' }}
        >
          <ol className="grid gap-4 list-none">
            {mockArtefacts.map((artefact, index) => (
              <div key={artefact.id} className="flex items-center gap-4">
                <span className="text-2xl font-bold text-gray-400 w-8 text-right">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <Artefact
                    id={artefact.id}
                    name={artefact.name}
                    description={artefact.description}
                  />
                </div>
              </div>
            ))}
          </ol>
        </div>
      </div>
    );
  }