import Link from "next/link";

export default function Home() {
  return (
    <main className="p-8">
      <Link href="/app">Open app</Link>
    </main>
  );
}
