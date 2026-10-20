import { describe as group, expect, it } from "vitest";
import { seedState } from "@/data/initial";
import { computeForecasts } from "./forecast";
import { buildWorld, describe, worldObjects, worldXY } from "./world";

const LINK = /^\/app\/(surplus|radar|needs|transfers)(\?|$)/;

group("surplus world", () => {
  const s = seedState();
  const world = buildWorld(s, computeForecasts(s));

  it("places every site inside the map", () => {
    expect(world.sites).toHaveLength(s.sites.length);
    for (const site of world.sites) {
      expect(Math.abs(site.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(site.y)).toBeLessThanOrEqual(1);
    }
  });

  it("has something to click of every kind in the seed data", () => {
    const kinds = new Set(worldObjects(world).map((o) => o.kind));
    for (const k of ["site", "pile", "ghost", "need", "transfer", "landfill"]) expect(kinds).toContain(k);
  });

  it("gives every object an info card, linking only to pages in the menu", () => {
    for (const o of worldObjects(world)) {
      const card = describe(world, o);
      expect(card, `${o.kind} ${o.id}`).not.toBeNull();
      expect(card!.title.length).toBeGreaterThan(0);
      if (card!.href) expect(card!.href).toMatch(LINK);
    }
  });

  it("sizes piles between 0 and 1", () => {
    for (const site of world.sites)
      for (const p of [...site.piles, ...site.ghosts]) {
        expect(p.scale).toBeGreaterThan(0);
        expect(p.scale).toBeLessThanOrEqual(1);
      }
  });

  it("drops a lorry once its transfer completes, and the landfill counter grows", () => {
    const t = world.transfers[0];
    const done = seedState();
    const tr = done.transfers.find((x) => x.id === t.id)!;
    tr.status = "Completed";
    tr.completedAt = done.today;
    const after = buildWorld(done, computeForecasts(done));
    expect(after.transfers.some((x) => x.id === t.id)).toBe(false);
    expect(after.impact.completed).toBe(world.impact.completed + 1);
    expect(after.impact.savedRm).toBeGreaterThan(world.impact.savedRm);
  });

  it("maps the north-west corner to the top left", () => {
    expect(worldXY(3.25, 101.24)).toEqual({ x: -1, y: -1 });
  });
});
