import AuthGuard from "@/components/authGuard";
import AuthButton from "@/components/ui/authButton";

export default function Home() {
  return (
    <AuthGuard adminOnly={true}>
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
            <h1>Admin User</h1>
            <AuthButton />
        </main>
        <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
            
        </footer>
        </div>
    </AuthGuard>
  );
}
