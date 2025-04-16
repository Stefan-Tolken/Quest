'use client';

import Link from "next/link";
import AuthButton from "./authButton";
import { useAuthState } from "@/lib/useAuth";

const NavBarClient: React.FC = () => {
    const { isAuthenticated } = useAuthState();

  return (
    <nav className="p-4 bg-gray-200 flex justify-between items-center">
        { isAuthenticated ? (
            <>
                <ul className="flex gap-4">
                    <li>
                        <Link
                        href="/client"
                        className="text-blue-600 hover:underline"
                        >
                            Home
                        </Link>
                    </li>
                    <li>
                        <Link
                        href="/client/quests"
                        className="text-blue-600 hover:underline"
                        >
                            Quests
                        </Link>
                    </li>
                    <li>
                        <Link
                        href="/client/scan"
                        className="text-blue-600 hover:underline"
                        >
                            Scan
                        </Link>
                    </li>
                    <li>
                        <Link
                        href="/client/artifacts"
                        className="text-blue-600 hover:underline"
                        >
                            Artifacts
                        </Link>
                    </li>
                    <li>
                        <Link
                        href="/client/profile"
                        className="text-blue-600 hover:underline"
                        >
                            Profile
                        </Link>
                    </li>
                </ul>
                <AuthButton />
            </>
        ) : (
            <>
                <h1>
                    <Link href="/" className="text-blue-600 hover:underline">
                        Quest
                    </Link>
                </h1>
                <AuthButton />
            </>
        )}            
    </nav>
  );
}

export default NavBarClient;