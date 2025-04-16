import Link from "next/link";
import AuthButton from "./authButton";

const NavBar: React.FC = () => {
  return (
    <nav className="p-4 bg-gray-200 flex justify-between items-center">            
        <ul className="flex gap-4">
            <li>
                <Link href="/" className="text-blue-600 hover:underline">
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
        </ul>
        <AuthButton />
    </nav>
  );
}

export default NavBar;