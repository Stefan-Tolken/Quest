'use client';

import Link from "next/link";
import AuthButton from "./authButton";
import { useAuthState } from "@/lib/useAuth";

const NavBar: React.FC = () => {
    const { isAuthenticated, user } = useAuthState();
    const userGroups = user?.profile?.['cognito:groups'] || [];
    const isAdmin = Array.isArray(userGroups) && userGroups.includes('Admin');

  return (
    <nav className="p-4 bg-gray-200 flex justify-between items-center">
        { isAuthenticated ? (
            <>
                <ul className="flex gap-4">
                    <li>
                        <Link href="/" className="text-blue-600 hover:underline">
                            Quest
                        </Link>
                    </li>
                    { isAdmin ? (
                        <>
                            <li>
                                <Link
                                href="/admin"
                                className="text-blue-600 hover:underline"
                                >
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link
                                href="/admin/page-builder"
                                className="text-blue-600 hover:underline"
                                >
                                    Page Builder
                                </Link>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link
                                href="/client"
                                className="text-blue-600 hover:underline"
                                >
                                    Home
                                </Link>
                            </li>
                        </>
                    )}
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

export default NavBar;