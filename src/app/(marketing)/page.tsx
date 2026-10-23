import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-4 p-6">
      <h1 className="text-display-xl">Rubi</h1>
      <p className="text-body">
        A professional storefront and order book for sellers on WhatsApp, Instagram and TikTok.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/sign-up">Create your store</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    </main>
  );
}
