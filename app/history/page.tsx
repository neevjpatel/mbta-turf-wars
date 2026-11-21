import type { CSSProperties } from "react";

const TIMELINE = [
  { year: "1895", title: "A subway takes shape", text: "Work began on the Tremont Street Subway, moving congested streetcar traffic below central Boston." },
  { year: "1897", title: "America’s first subway opens", text: "The first section opened September 1 between the Public Garden incline and Park Street." },
  { year: "1901–1908", title: "Rapid transit expands", text: "Elevated rapid-transit trains first shared the Tremont tunnel, then moved into the purpose-built Washington Street tunnel." },
  { year: "1912–1916", title: "Cambridge and East Boston connections", text: "New tunnels and extensions helped form the ancestors of today’s Red and Blue lines." },
  { year: "1947", title: "The MTA era", text: "The Metropolitan Transit Authority assumed responsibility for Boston’s subway network." },
  { year: "1964", title: "The MBTA is established", text: "Massachusetts replaced the MTA with the regional Massachusetts Bay Transportation Authority." },
  { year: "Today", title: "A connected region", text: "Subway, bus, commuter rail, ferry, and paratransit service connect communities across Greater Boston." },
];

const LINES = [
  { name: "Green Line", color: "#00843D", text: "Descended from Boston’s streetcar network, it still uses the historic Tremont Street Subway and branches west from downtown." },
  { name: "Blue Line", color: "#003DA5", text: "Its core grew from the East Boston Tunnel beneath Boston Harbor, later converted from streetcars to rapid transit." },
  { name: "Orange Line", color: "#ED8B00", text: "It developed from Boston Elevated Railway’s Main Line and the 1908 Washington Street tunnel." },
  { name: "Red Line", color: "#DA291C", text: "The Cambridge–Dorchester rapid-transit line linked Harvard Square with downtown before expanding south and northwest." },
];

export default function HistoryPage() {
  return (
    <main className="history-page">
      <section className="history-hero"><span className="history-roundel">T</span><div><p className="eyebrow">The real system behind the game</p><h1>Boston has always moved differently.</h1><p>From horse cars and electric streetcars to the nation’s first subway, public transportation has shaped how Greater Boston grows and connects.</p></div></section>
      <section className="history-timeline" aria-labelledby="timeline-title"><div className="section-heading"><p className="eyebrow">A line through time</p><h2 id="timeline-title">Transit milestones</h2></div><div className="timeline-track">{TIMELINE.map((item) => <article key={item.year}><span>{item.year}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>
      <section className="line-history" aria-labelledby="line-title"><div className="section-heading"><p className="eyebrow">Four lines · four stories</p><h2 id="line-title">The subway network</h2><p>The game borrows these colors for difficulty themes; that fictional mapping does not describe real MBTA service difficulty.</p></div><div className="line-history-grid">{LINES.map((line) => <article key={line.name} style={{ "--history-line": line.color } as CSSProperties}><span className="line-history-badge">T</span><h3>{line.name}</h3><p>{line.text}</p></article>)}</div></section>
      <section className="history-sources"><div><p className="eyebrow">Keep exploring</p><h2>Sources and further reading</h2><p>Historical statements on this page are summarized from public records and institutional sources.</p></div><ul><li><a href="https://npgallery.nps.gov/GetAsset/cc3a418b-95a0-41f8-bf6b-7ec357e2fd43" target="_blank" rel="noreferrer">National Park Service · Tremont Street Subway nomination</a></li><li><a href="https://www.mass.gov/info-details/overview-of-the-massachusetts-bay-transportation-authority-0" target="_blank" rel="noreferrer">Mass.gov · Overview of the MBTA</a></li><li><a href="https://archives.lib.state.ma.us/entities/archivalmaterial/31ae89ec-1bd6-4d7d-aca9-79648e693473" target="_blank" rel="noreferrer">State Library of Massachusetts · 1964 enabling act</a></li><li><a href="https://www.cityofboston.gov/images_documents/Guide%20to%20the%20Transit%20Department%20records_tcm3-30031.pdf" target="_blank" rel="noreferrer">City of Boston Archives · Transit Department records</a></li></ul></section>
    </main>
  );
}
