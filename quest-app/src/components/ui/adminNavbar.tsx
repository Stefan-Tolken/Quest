// components/adminNavbar.tsx
'use client';

import Link from "next/link";
import AuthButton from "./authButton";
import { useAuthState } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigationGuardContext } from "@/context/NavigationGuardContext";

const NavBarAdmin: React.FC = () => {
  const { isAuthenticated } = useAuthState();
  const { guardNavigation } = useNavigationGuardContext();

  // Handle navigation with guard
  const handleGuardedNavigation = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    guardNavigation(href);
  };

  return (
    <nav className="p-4 bg-gray-200 flex justify-between items-center fixed top-0 left-0 right-0 z-10">
        {isAuthenticated ? (
        <>
            <div className="flex gap-4">
                <Link 
                    href="/admin"
                    onClick={(e) => {
                        e.preventDefault();
                        handleGuardedNavigation("/admin", e);
                    }}
                >
                    <Button variant={"link"}>
                        Home
                    </Button>
                </Link>
                
                <Link 
                    href="/admin/page-builder"
                    onClick={(e) => {
                        e.preventDefault();
                        handleGuardedNavigation("/admin/page-builder", e);
                    }}
                >
                    <Button variant={"link"}>
                        Page Builder
                    </Button>
                </Link>
                
                <Link 
                    href="/admin/quest-builder"
                    onClick={(e) => {
                        e.preventDefault();
                        handleGuardedNavigation("/admin/quest-builder", e);
                    }}
                >
                    <Button variant={"link"}>
                        Quest Builder
                    </Button>
                </Link>
                
                <Link 
                    href="/admin/3dModel-builder"
                    onClick={(e) => {
                        e.preventDefault();
                        handleGuardedNavigation("/admin/3dModel-builder", e);
                    }}
                >
                    <Button variant={"link"}>
                        3D Model
                    </Button>
                </Link>
            </div>
            
            <div className="flex gap-4 items-center">
                <Link 
                    href="/client"
                    onClick={(e) => {
                        e.preventDefault();
                        handleGuardedNavigation("/client", e);
                    }}
                >
                    <Button variant={"outline"}>
                        Client View
                    </Button>
                </Link>
                <AuthButton />
            </div>
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
};

export default NavBarAdmin;