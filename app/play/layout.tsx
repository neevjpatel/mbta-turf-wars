// Wraps every game under /play with the player identity (guest or signed in) and the small sign-in bar.
// A new file: none of the game pages had to change for this.
// The <Suspense> also lets T Guesser's random image order render per visit instead of failing `next build`.
import { Suspense } from "react";
import Link from "next/link";
import { PlayerProvider } from "@/app/_stats/player";

export default function PlayLayout({ children }: LayoutProps<"/play">) {
  return (
    <PlayerProvider>
      <header className="w-full bg-[#0E172A] border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <Link
          href="/play/charlie-run"
          className="flex items-center gap-3 shrink-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/charlie-run.png"
            alt="Charlie Run Logo"
            className="h-10 sm:h-11 w-auto shrink-0 rounded-lg object-contain bg-[#0E172A] border border-slate-700/70 shadow-sm"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-base sm:text-lg font-black tracking-tight text-white">
              Charlie Run
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Boston MBTA Edition
            </span>
          </div>
        </Link>
      </header>

      <Suspense
        fallback={
          <main className="utility-page">
            <p>Preparing game service…</p>
          </main>
        }
      >
        {children}
      </Suspense>
    </PlayerProvider>
  );
}
