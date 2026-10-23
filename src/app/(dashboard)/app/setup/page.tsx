import { SetupForm } from "@/features/stores/setup-form";

export default function StoreSetupPage() {
  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Set up your store</h1>
      <SetupForm />
    </main>
  );
}
