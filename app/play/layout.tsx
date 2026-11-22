// Wraps every game under /play with the player identity (guest or signed in) and the small sign-in bar.
// A new file: none of the game pages had to change for this.
// The <Suspense> also lets T Guesser's random image order render per visit instead of failing `next build`.
import { Suspense } from "react";
import { PlayerProvider } from "@/app/_stats/player";

export default function PlayLayout({ children }: LayoutProps<"/play">) {
  return (
    <PlayerProvider>
      <Suspense fallback={<main className="utility-page"><p>Preparing game service…</p></main>}>{children}</Suspense>
    </PlayerProvider>
  );
}
