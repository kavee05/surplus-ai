"use client";

import { Command } from "cmdk";
import { Camera, PlayCircle, Radar, RotateCcw, Search, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDemo } from "@/components/demo/guided-demo";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { people } from "@/data/seed";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { allNav } from "./nav";

const PaletteContext = createContext<{ open: () => void } | null>(null);

export const usePalette = () => useContext(PaletteContext) ?? { open: () => {} };

const ITEM =
  "flex cursor-default items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none select-none data-[selected=true]:bg-muted data-[selected=true]:text-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";
const GROUP = "px-1.5 py-1 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground";

/** Ctrl or Cmd + K: jump to any page, run common actions, or find surplus by material. */
export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const router = useRouter();
  const { state, dispatch } = useStore();
  const { start } = useDemo();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const run = useCallback((fn: () => void) => {
    setOpen(false);
    fn();
  }, []);

  const materials = useMemo(() => {
    const ids = new Set(state.listings.filter((l) => l.status === "available").map((l) => l.materialId));
    return state.materials.filter((m) => ids.has(m.id));
  }, [state.listings, state.materials]);

  const ctx = useMemo(() => ({ open: () => setOpen(true) }), []);

  return (
    <PaletteContext.Provider value={ctx}>
      {children}
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-[18%] translate-y-0 gap-0 overflow-hidden rounded-2xl p-0 shadow-[var(--shadow-3)] data-open:animate-none data-closed:animate-none sm:max-w-lg"
        >
          <DialogTitle className="sr-only">Command palette</DialogTitle>
          <DialogDescription className="sr-only">Search pages and actions. Use the arrow keys to move and Enter to choose.</DialogDescription>
          <Command loop label="Command palette">
            <div className="flex items-center gap-2 border-b px-3.5">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <Command.Input placeholder="Go to a page or run an action" className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">Esc</kbd>
            </div>
            <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto overscroll-contain py-1">
              <Command.Empty className="px-4 py-6 text-center text-sm text-muted-foreground">Nothing matches. Try a page name or a material.</Command.Empty>
              <Command.Group heading="Actions" className={GROUP}>
                <Command.Item className={ITEM} onSelect={() => run(() => router.push("/app/radar"))}>
                  <Radar aria-hidden /> Run a Pre-Order Check
                </Command.Item>
                <Command.Item className={ITEM} onSelect={() => run(() => router.push("/app/surplus/log"))}>
                  <Camera aria-hidden /> Log surplus from a photo
                </Command.Item>
                <Command.Item className={ITEM} onSelect={() => run(() => start())}>
                  <PlayCircle aria-hidden /> Start guided demo
                </Command.Item>
                <Command.Item
                  className={ITEM}
                  onSelect={() =>
                    run(() => {
                      dispatch({ type: "reset" });
                      toast.success("Demo data reset to the original simulated seed.");
                    })
                  }
                >
                  <RotateCcw aria-hidden /> Reset demo data
                </Command.Item>
              </Command.Group>
              <Command.Group heading="Pages" className={GROUP}>
                {allNav.map((n) => (
                  <Command.Item key={n.href} className={ITEM} onSelect={() => run(() => router.push(n.href))}>
                    <n.icon aria-hidden /> {n.label}
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading="View as (fictional people)" className={GROUP}>
                {(Object.keys(people) as Role[]).map((r) => (
                  <Command.Item
                    key={r}
                    value={`view as ${people[r].title} ${people[r].name}`}
                    className={ITEM}
                    onSelect={() =>
                      run(() => {
                        dispatch({ type: "setRole", role: r });
                        toast.success(`Now viewing as ${people[r].title.toLowerCase()}`);
                      })
                    }
                  >
                    <UserRound aria-hidden /> {people[r].title}
                    <span className="ml-auto text-xs text-muted-foreground">{people[r].name}</span>
                  </Command.Item>
                ))}
              </Command.Group>
              {materials.length > 0 && (
                <Command.Group heading="Surplus available now" className={GROUP}>
                  {materials.map((m) => (
                    <Command.Item key={m.id} value={`surplus ${m.name} ${m.category}`} className={ITEM} onSelect={() => run(() => router.push(`/app/surplus?q=${encodeURIComponent(m.name)}`))}>
                      <Search aria-hidden /> {m.name}
                      <span className="ml-auto text-xs text-muted-foreground">{m.category}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </PaletteContext.Provider>
  );
}
