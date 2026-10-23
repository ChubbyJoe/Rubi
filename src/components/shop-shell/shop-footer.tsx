import { PoweredBy } from "@/components/brand/powered-by";

export function ShopFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-shop items-center justify-center px-4 py-12 md:px-8">
        <PoweredBy />
      </div>
    </footer>
  );
}
