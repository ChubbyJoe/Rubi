import type { ReactNode } from "react";
import { InboxIcon, PlusIcon, TriangleAlertIcon } from "lucide-react";
import { PoweredBy } from "@/components/brand/powered-by";
import { DotMark, Wordmark } from "@/components/brand/wordmark";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_TONES } from "@/lib/design/tokens";
import { formatNaira } from "@/lib/money";

// Shows a control as it looks with keyboard focus, without stealing focus.
const FOCUSED = "outline-2 outline-offset-2 outline-ring";

const TYPE_SCALE = [
  ["text-stat-display tabular-nums", "stat-display", formatNaira(24_186_000)],
  ["text-display-xl", "display-xl", "Orders"],
  ["text-display-lg", "display-lg", "Ankara wrap, 6 yards"],
  ["text-price-lg tabular-nums", "price-lg", formatNaira(1_500_000)],
  ["text-display-sm", "display-sm", "Payment details"],
  ["text-title-md", "title-md", "Pricing"],
  ["text-title-sm", "title-sm", "Shipping"],
  ["text-body-md", "body-md", "A photo, a name and a price is enough to start."],
  ["text-body-sm", "body-sm", "Placed today at 10:42"],
  ["text-caption", "caption", "Product name"],
  ["text-caption-sm", "caption-sm", "Updated 2 minutes ago"],
  ["text-column-head text-muted-foreground", "column-head", "CUSTOMER"],
  ["text-link underline", "link", "View all orders"],
  ["text-nav-link", "nav-link", "Products"],
] as const;

const SWATCHES = [
  ["bg-background", "background"],
  ["bg-muted", "muted"],
  ["bg-secondary", "secondary"],
  ["bg-border", "border"],
  ["bg-input", "input"],
  ["bg-foreground", "foreground"],
  ["bg-muted-foreground", "muted-foreground"],
  ["bg-primary", "primary"],
  ["bg-primary-active", "primary-active"],
  ["bg-primary-tint", "primary-tint"],
  ["bg-destructive", "destructive"],
  ["bg-toast", "toast"],
] as const;

export function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = `preview-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="text-display-sm">
        {title}
      </h2>
      {children}
    </section>
  );
}

function State({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-caption-sm text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

/** Every primitive and state on the current surface (spec 0003, AC-12). */
export function PrimitivesPreview({ surface }: { surface: "admin" | "shop" }) {
  const id = (name: string) => `${surface}-${name}`;
  return (
    <div className="flex flex-col gap-12">
      <Section title="Brand">
        <div className="flex flex-wrap items-center gap-8">
          <Wordmark className="text-[2.5rem]" />
          <Wordmark className="text-[1.75rem]" />
          <DotMark />
          <PoweredBy />
        </div>
      </Section>

      <Section title="Type">
        <dl className="flex flex-col gap-3">
          {TYPE_SCALE.map(([className, token, sample]) => (
            <div key={token} className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-6">
              <dt className="w-32 shrink-0 text-caption-sm text-muted-foreground">{token}</dt>
              <dd className={className}>{sample}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Color">
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {SWATCHES.map(([className, token]) => (
            <li key={token} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={`size-10 shrink-0 rounded-xs border border-border ${className}`}
              />
              <span className="text-body-sm">{token}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Buttons">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <State label="Primary">
            <Button>Save product</Button>
          </State>
          <State label="Primary, focus">
            <Button className={FOCUSED}>Save product</Button>
          </State>
          <State label="Primary, loading">
            <Button disabled>
              <Spinner />
              Saving
            </Button>
          </State>
          <State label="Primary, disabled">
            <Button disabled>Publish</Button>
          </State>
          <State label="Secondary">
            <Button variant="outline">Cancel</Button>
          </State>
          <State label="Tertiary">
            <Button variant="ghost">View all</Button>
          </State>
          <State label="Destructive">
            <Button variant="destructive">Archive product</Button>
          </State>
          <State label="Link">
            <Button variant="link">Edit</Button>
          </State>
          <State label="Compact (44px hit area)">
            <div className="flex gap-2">
              <Button size="sm">
                <PlusIcon aria-hidden="true" />
                Add
              </Button>
              <Button size="sm" variant="outline">
                Export
              </Button>
            </div>
          </State>
          <State label="Icon">
            <div className="flex gap-2">
              <Button size="icon" variant="secondary" aria-label="Add product">
                <PlusIcon aria-hidden="true" />
              </Button>
              <Button size="icon-sm" variant="outline" aria-label="Add variant">
                <PlusIcon aria-hidden="true" />
              </Button>
            </div>
          </State>
        </div>
      </Section>

      <Section title="Fields">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={id("name")}>Product name</FieldLabel>
            <Input id={id("name")} placeholder="Ankara wrap" />
            <FieldDescription>Customers see this on your shop.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor={id("name-focus")}>Product name, focus</FieldLabel>
            <Input id={id("name-focus")} defaultValue="Ankara wrap" className={FOCUSED} />
          </Field>
          <Field data-invalid>
            <FieldLabel htmlFor={id("phone")}>Phone number</FieldLabel>
            <Input
              id={id("phone")}
              defaultValue="0803"
              aria-invalid
              aria-describedby={id("phone-error")}
            />
            <FieldError id={id("phone-error")}>Enter a full Nigerian phone number.</FieldError>
          </Field>
          <Field data-disabled>
            <FieldLabel htmlFor={id("slug")}>Shop link, disabled</FieldLabel>
            <Input id={id("slug")} defaultValue="ada-fabrics" disabled />
          </Field>
          <Field>
            <FieldLabel htmlFor={id("price")}>Price</FieldLabel>
            <InputGroup>
              <InputGroupAddon>₦</InputGroupAddon>
              <InputGroupInput id={id("price")} inputMode="decimal" placeholder="15,000.00" />
            </InputGroup>
          </Field>
          <Field data-invalid>
            <FieldLabel htmlFor={id("price-error")}>Price, error</FieldLabel>
            <InputGroup>
              <InputGroupAddon>₦</InputGroupAddon>
              <InputGroupInput
                id={id("price-error")}
                inputMode="decimal"
                defaultValue="0"
                aria-invalid
                aria-describedby={id("price-error-message")}
              />
            </InputGroup>
            <FieldError id={id("price-error-message")}>Enter a price above ₦0.00.</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor={id("description")}>Description</FieldLabel>
            <Textarea id={id("description")} placeholder="Fabric, size and care" />
          </Field>
          <Field>
            <FieldLabel htmlFor={id("category")}>Category</FieldLabel>
            <NativeSelect id={id("category")} defaultValue="fabric">
              <NativeSelectOption value="fabric">Fabric</NativeSelectOption>
              <NativeSelectOption value="clothing">Clothing</NativeSelectOption>
              <NativeSelectOption value="accessories">Accessories</NativeSelectOption>
            </NativeSelect>
          </Field>
        </div>
      </Section>

      <Section title="Badges and status">
        <div className="flex flex-wrap gap-3">
          {STATUS_TONES.map((tone) => (
            <StatusBadge key={tone} tone={tone}>
              {
                {
                  success: "Paid",
                  info: "Awaiting payment",
                  attention: "Low stock",
                  neutral: "Archived",
                }[tone]
              }
            </StatusBadge>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Badge>New</Badge>
          <Badge variant="secondary">Draft</Badge>
          <Badge variant="outline">3 variants</Badge>
        </div>
      </Section>

      <Section title="Surfaces">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Order #1042</CardTitle>
              <CardDescription>Chiamaka E., 2 items</CardDescription>
              <CardAction>
                <StatusBadge tone="info">New</StatusBadge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex items-baseline justify-between">
              <span className="text-body-sm text-muted-foreground">Total</span>
              <span className="text-price-lg tabular-nums">{formatNaira(4_800_000)}</span>
            </CardContent>
          </Card>
          <div className="flex flex-col gap-4">
            <Alert>
              <InboxIcon aria-hidden="true" />
              <AlertTitle>Your shop is live</AlertTitle>
              <AlertDescription>
                Share your link on WhatsApp to get your first order.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <TriangleAlertIcon aria-hidden="true" />
              <AlertTitle>That photo did not upload</AlertTitle>
              <AlertDescription>Check your connection and try again.</AlertDescription>
            </Alert>
          </div>
        </div>
        <Separator />
        <Empty className="border border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>No products yet</EmptyTitle>
            <EmptyDescription>
              Add your first one: a photo, a name and a price is enough to start.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button>Add a product</Button>
          </EmptyContent>
        </Empty>
      </Section>

      <Section title="Loading">
        <p className="text-body-sm text-muted-foreground">
          Skeletons stay hidden for 300ms, then shimmer (no shimmer with reduced motion).
        </p>
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-sm" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </Section>
    </div>
  );
}
