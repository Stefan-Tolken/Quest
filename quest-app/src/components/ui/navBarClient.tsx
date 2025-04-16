'use client';

import Link from "next/link";

const NavBarClient: React.FC = () => {

  return (
    <nav className="p-4 bg-gray-200 flex justify-between items-center">
        <ul className="flex gap-4">
            <li>
                <Link
                href="/quests"
                className="text-blue-600 hover:underline"
                >
                    Quests
                </Link>
            </li>
            <li>
                <Link
                href="/scan"
                className="text-blue-600 hover:underline"
                >
                    Scan
                </Link>
            </li>
            <li>
                <Link
                href="/artifacts"
                className="text-blue-600 hover:underline"
                >
                    Artifacts
                </Link>
            </li>
            <li>
                <Link
                href="/profile"
                className="text-blue-600 hover:underline"
                >
                    Profile
                </Link>
            </li>
        </ul> 
    </nav>
  );
}

export default NavBarClient;