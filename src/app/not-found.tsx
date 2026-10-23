import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-3 p-6">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p>This link may be wrong, or the store may no longer be online.</p>
      <Link href="/" className="underline">
        Go to Rubi
      </Link>
    </main>
  );
}
