import { and, eq, isNull, sql } from "drizzle-orm";
import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, withNewStore, withStore, withUser } from "@/lib/db";
import { stores, storeSlugs } from "@/lib/db/schema";
import { connectOwner, eraseSellers, expectPgCode, insertSellers, newRun } from "@/test/db";
import { createStore } from "./create-store";

const run = newRun();
let owner: Client;
let userIds: string[];

const slugAvailable = (userId: string, slug: string) =>
  withUser(userId, (tx) =>
    tx.execute<{ available: boolean }>(sql`select public.slug_available(${slug}) as available`),
  ).then((result) => result.rows[0].available);

beforeAll(async () => {
  owner = await connectOwner();
  userIds = await insertSellers(owner, run, ["a", "b", "c", "d"]);
});

afterAll(async () => {
  await eraseSellers(owner, userIds);
  await owner.end();
  await db.$client.end();
});

describe("createStore", () => {
  const slugA = `setup-a-${run}`;
  let storeA: { storeId: string; slug: string };

  // covers: AC-5
  it("creates the store, owned by the user, with its current slug row", async () => {
    const result = await createStore(userIds[0], { name: "Ada Fabrics", slug: slugA });
    if (!result.ok) throw new Error(result.error);
    storeA = result.data;
    const { rows } = await owner.query(
      `select s.owner_user_id, s.name, s.slug, s.published_at, ss.retired_at
       from public.stores s join public.store_slugs ss on ss.store_id = s.id
       where s.id = $1`,
      [storeA.storeId],
    );
    expect(storeA.slug).toBe(slugA);
    expect(rows).toEqual([
      {
        owner_user_id: userIds[0],
        name: "Ada Fabrics",
        slug: slugA,
        published_at: null,
        retired_at: null,
      },
    ]);
  });

  // covers: AC-5
  it("gives a user who already has a store that store back", async () => {
    const again = await createStore(userIds[0], { name: "Another", slug: `setup-a2-${run}` });
    expect(again).toEqual({ ok: true, data: storeA });
    const { rows } = await owner.query(
      "select count(*)::int as n from public.stores where owner_user_id = $1",
      [userIds[0]],
    );
    expect(rows[0].n).toBe(1);
  });

  it("normalises the slug to lower case", async () => {
    const result = await createStore(userIds[2], {
      name: "Chi",
      slug: `  SETUP-C-${run.toUpperCase()} `,
    });
    expect(result).toMatchObject({ ok: true, data: { slug: `setup-c-${run}` } });
  });

  it.each([
    ["a blank name", { name: " ", slug: `setup-x-${run}` }],
    ["a slug with spaces", { name: "X", slug: "bad slug" }],
  ])("returns invalid for %s and writes nothing", async (_, input) => {
    expect(await createStore(userIds[3], input)).toEqual({ ok: false, error: "invalid" });
    const { rows } = await owner.query(
      "select count(*)::int as n from public.stores where owner_user_id = $1",
      [userIds[3]],
    );
    expect(rows[0].n).toBe(0);
  });

  // covers: AC-5
  it("returns slug_taken when another store holds the slug", async () => {
    expect(await createStore(userIds[1], { name: "Copycat", slug: slugA })).toEqual({
      ok: false,
      error: "slug_taken",
    });
  });

  // covers: AC-5
  it("holds a retired slug: it is not available and cannot be taken", async () => {
    const renamed = `setup-a-new-${run}`;
    await withStore(storeA.storeId, async (tx) => {
      await tx
        .update(storeSlugs)
        .set({ retiredAt: new Date() })
        .where(and(eq(storeSlugs.slug, slugA), isNull(storeSlugs.retiredAt)));
      await tx.insert(storeSlugs).values({ slug: renamed, storeId: storeA.storeId });
      await tx.update(stores).set({ slug: renamed }).where(eq(stores.id, storeA.storeId));
    });
    expect(await slugAvailable(userIds[3], slugA)).toBe(false);
    expect(await slugAvailable(userIds[3], renamed)).toBe(false);
    expect(await createStore(userIds[3], { name: "Squatter", slug: slugA })).toEqual({
      ok: false,
      error: "slug_taken",
    });
  });

  // covers: AC-5
  it("reports an unused slug as available", async () => {
    expect(await slugAvailable(userIds[3], `free-${run}`)).toBe(true);
  });
});

describe("store setup policies", () => {
  // covers: AC-2
  it("refuses a store whose owner is not the signed in user", async () => {
    await expectPgCode("42501", () =>
      withNewStore(userIds[3], (tx, storeId) =>
        tx.insert(stores).values({
          id: storeId,
          ownerUserId: userIds[1],
          name: "Not mine",
          slug: `setup-steal-${run}`,
        }),
      ),
    );
  });

  // covers: AC-2
  it("withUser shows a user only their own store", async () => {
    const visible = await withUser(userIds[2], (tx) =>
      tx.select({ owner: stores.ownerUserId }).from(stores),
    );
    expect(visible).toEqual([{ owner: userIds[2] }]);
  });
});
