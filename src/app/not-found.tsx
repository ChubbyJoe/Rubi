import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-16"
    >
      <Wordmark className="mb-4 text-[1.75rem]" />
      <h1 className="text-display-xl">Page not found</h1>
      <p className="text-body-md text-body">
        This link may be wrong, or the shop may no longer be online.
      </p>
      <Button asChild variant="outline" className="self-start">
        <Link href="/">Go to Rubi</Link>
      </Button>
    </main>
  );
}
