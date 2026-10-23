import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-4 p-6">
      <h1 className="text-3xl font-semibold">Rubi</h1>
      <p>A professional storefront and order book for sellers on WhatsApp, Instagram and TikTok.</p>
      <div className="flex gap-4">
        <Link href="/sign-up" className="underline">Create your store</Link>
        <Link href="/sign-in" className="underline">Sign in</Link>
      </div>
    </main>
  );
}
