import Link from "next/link";
import { MessageCircleIcon, ReceiptTextIcon, StoreIcon } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";

const POINTS = [
  {
    icon: StoreIcon,
    title: "A shop link that looks the part",
    body: "Your products on one clean page, ready to share on WhatsApp, Instagram and TikTok.",
  },
  {
    icon: MessageCircleIcon,
    title: "Orders that land in one place",
    body: "Customers order without an account, then continue with you on WhatsApp.",
  },
  {
    icon: ReceiptTextIcon,
    title: "Know who has paid",
    body: "Mark a transfer as paid and see what still needs your attention.",
  },
] as const;

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex h-18 w-full max-w-shop items-center justify-between px-4 md:px-8">
        <Link href="/" className="relative after:absolute after:-inset-3">
          <Wordmark className="text-[1.75rem]" />
        </Link>
        <Button asChild variant="ghost" size="sm">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </header>

      <main
        id="main"
        className="mx-auto flex w-full max-w-shop flex-1 flex-col gap-16 px-4 pt-12 pb-16 md:px-8 md:pt-20"
      >
        <section className="flex max-w-xl flex-col gap-4">
          <h1 className="text-display-xl">Sell like a real shop, straight from your phone.</h1>
          <p className="text-body-md text-body">
            Rubi gives sellers on WhatsApp, Instagram and TikTok a professional storefront and an
            order book that does not live in their chat history.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/sign-up">Create your shop</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </section>

        <section aria-labelledby="why" className="flex flex-col gap-6">
          <h2 id="why" className="text-display-sm">
            Everything a small shop needs to start
          </h2>
          <ul className="grid gap-6 md:grid-cols-3">
            {POINTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex flex-col gap-3 rounded-md border border-border p-6">
                <span className="flex size-12 items-center justify-center rounded-sm bg-secondary">
                  <Icon aria-hidden="true" className="size-6 text-foreground" />
                </span>
                <h3 className="text-title-md">{title}</h3>
                <p className="text-body-sm text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-shop items-center justify-between gap-4 px-4 py-8 md:px-8">
          <Wordmark className="text-[1.25rem]" />
          <p className="text-caption-sm text-muted-foreground">Made for sellers in Nigeria.</p>
        </div>
      </footer>
    </div>
  );
}
