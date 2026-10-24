import { Wordmark } from "@/components/brand/wordmark";
import { SetupForm } from "@/features/stores/setup-form";

export default function StoreSetupPage() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-10"
    >
      <Wordmark className="mb-4 text-[1.75rem]" />
      <h1 className="text-display-xl">Set up your store</h1>
      <SetupForm />
    </main>
  );
}
