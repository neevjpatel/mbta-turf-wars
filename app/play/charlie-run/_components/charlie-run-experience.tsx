"use client";

import dynamic from "next/dynamic";

const CharlieRunScene = dynamic(() => import("./charlie-run-scene"), {
  ssr: false,
  loading: () => <section className="charlie-run-scene" aria-label="Charlie Run loading" />,
});

export default function CharlieRunExperience() {
  return <CharlieRunScene />;
}
