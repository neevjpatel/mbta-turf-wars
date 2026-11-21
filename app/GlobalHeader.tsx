"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppState } from "./AppState";

const NAV_ITEMS = [
  { href: "/?station=turf", label: "Home" },
  { href: "/history", label: "History" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export default function GlobalHeader() {
  const pathname = usePathname();
  const { muted, setMuted } = useAppState();
  const [stateReady, setStateReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setStateReady(true), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const displayedMuted = stateReady ? muted : true;
  return (
    <header className="global-header">
      <Link className="global-brand" href="/?station=turf" aria-label="MBTA Turf Wars home"><span className="t-roundel">T</span><span><strong>MBTA TURF WARS</strong><small>Boston challenge line</small></span></Link>
      <nav aria-label="Global navigation">
        {NAV_ITEMS.map((item) => <Link key={item.href} href={item.href} className={(item.href.startsWith("/?") ? pathname === "/" : pathname === item.href) ? "active" : ""}>{item.label}</Link>)}
        <button type="button" className="audio-toggle" onClick={() => setMuted(!muted)} aria-pressed={!displayedMuted}>{displayedMuted ? "Sound Off" : "Sound On"}</button>
        <Link href="/profile" className={`profile-link ${pathname === "/profile" ? "active" : ""}`}><span className="avatar">KS</span><span className="profile-label">Profile</span></Link>
      </nav>
    </header>
  );
}
