import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { AdminSurface } from "@/components/admin-surface";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSurface>
      <header className="mx-auto flex h-18 w-full max-w-sm items-center px-4">
        <Link href="/" className="relative after:absolute after:-inset-3">
          <Wordmark className="text-[1.75rem]" />
        </Link>
      </header>
      {children}
    </AdminSurface>
  );
}
