import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AppStateProvider } from "./AppState";
import GlobalHeader from "./GlobalHeader";

export const metadata: Metadata = {
  title: "MBTA Turf Wars",
  description: "Ride the challenge line and capture Boston's transit turf.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full"
    >
      <body className="min-h-full flex flex-col">
        <AppStateProvider>
          <Suspense fallback={<div className="global-header global-header-fallback" aria-hidden="true" />}><GlobalHeader /></Suspense>
          <div className="app-content">{children}</div>
        </AppStateProvider>
      </body>
    </html>
  );
}
