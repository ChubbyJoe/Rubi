import { Suspense } from "react";
import { InboxIcon } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { getSellerContext } from "@/lib/auth/session";

export default function DashboardHome() {
  return (
    <>
      <Suspense fallback={<Skeleton className="h-9 w-64" />}>
        <Greeting />
      </Suspense>
      <Empty className="border border-border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <InboxIcon />
          </EmptyMedia>
          <EmptyTitle>No orders yet</EmptyTitle>
          <EmptyDescription>
            When customers order from your shop, their orders show up here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </>
  );
}

async function Greeting() {
  const seller = await getSellerContext();
  const firstName = seller.name.trim().split(/\s+/)[0];
  return <h1 className="text-display-xl">{firstName ? `Welcome, ${firstName}` : "Home"}</h1>;
}
