import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

// All photos are public domain (pre-1929 / government works), via Wikimedia Commons. Credits are listed at the bottom.
const PHOTOS = {
  dig: { src: "/history/streetcars-around-the-dig-1897.jpg", w: 1400, h: 1117, source: "https://commons.wikimedia.org/wiki/File:Shoo-fly_tracks_around_Park_Street_station_construction,_circa_1897_LCCN92514843.jpg", credit: "Library of Congress, c. 1897" },
  church: { src: "/history/park-street-church-construction.jpg", w: 1400, h: 1128, source: "https://commons.wikimedia.org/wiki/File:Park_St._subway_const._-_DPLA_-_cd1aa5c46cdd2cd87ce1e85a07d9771d.jpg", credit: "Boston Public Library, c. 1896" },
  explosion: { src: "/history/explosion-1897.jpg", w: 1400, h: 1123, source: "https://commons.wikimedia.org/wiki/File:Corner_of_Tremont_and_Boylston_(Boylston_Street_explosion)_-_DPLA_-_c57c827bec4e69c8488dcee8596ee91e.jpg", credit: "N. L. Stebbins / Boston Public Library, March 4, 1897" },
  opening: { src: "/history/opening-day-1897.jpg", w: 1400, h: 1110, source: "https://commons.wikimedia.org/wiki/File:Crowd_at_Public_Garden_Portal,_September_1,_1897.jpg", credit: "Boston Public Works Department / City of Boston Archives, Sept. 1, 1897" },
  elevated: { src: "/history/elevated-railway-1901.jpg", w: 1150, h: 1400, source: "https://commons.wikimedia.org/wiki/File:Atlantic_Avenue_Elevated_train_approaching_Tower_D,_September_1901.jpg", credit: "Boston Elevated Railway / City of Boston Archives, Sept. 23, 1901" },
} as const;

const TIMELINE = [
  { year: "1888", title: "Gridlock", text: "A great blizzard paralyzes Boston, and the streetcars crowding Tremont Street make the case for moving traffic off the street." },
  { year: "1895", title: "A subway takes shape", text: "On March 28 the Boston Transit Commission breaks ground in the Public Garden, near Boylston and Charles streets." },
  { year: "1897", title: "America’s first subway opens", text: "On September 1 streetcars roll underground between the Public Garden incline and Park Street, on time and under budget." },
  { year: "1901–1908", title: "Rapid transit expands", text: "Elevated trains first share the Tremont tunnel, then move into the purpose-built Washington Street tunnel." },
  { year: "1912–1916", title: "Cambridge and East Boston", text: "New tunnels and extensions form the ancestors of today’s Red and Blue lines." },
  { year: "1947", title: "The MTA era", text: "The Metropolitan Transit Authority takes over Boston’s subway network." },
  { year: "1964", title: "The MBTA is born", text: "Massachusetts replaces the MTA with the regional Massachusetts Bay Transportation Authority." },
  { year: "2006", title: "Tokens retire", text: "On December 4 the CharlieCard arrives, and the metal subway token is phased out that month." },
  { year: "2024", title: "Tap to ride", text: "On August 1 riders can pay on buses and the subway by tapping a contactless bank card or phone." },
];

const LINES = [
  { name: "Green Line", color: "#00843D", text: "Descended from Boston’s streetcar network, it still runs through the 1897 Tremont Street Subway and branches west from downtown." },
  { name: "Blue Line", color: "#003DA5", text: "Its core grew from the East Boston Tunnel beneath Boston Harbor, later converted from streetcars to rapid transit." },
  { name: "Orange Line", color: "#ED8B00", text: "It developed from the Boston Elevated Railway’s Main Line and the 1908 Washington Street tunnel." },
  { name: "Red Line", color: "#DA291C", text: "The Cambridge–Dorchester rapid-transit line linked Harvard Square with downtown before expanding south and northwest." },
];

const BUILD_STEPS = [
  { title: "Dig from the street", text: "Crews opened a trench straight down from the road surface, a method called cut-and-cover." },
  { title: "Brace the walls", text: "Temporary timber braces held back the earth while the tunnel walls and roof went in." },
  { title: "Keep the city moving", text: "“Shoo-fly” tracks carried streetcars around the open trenches so service never had to stop." },
  { title: "Cover it back up", text: "Once a section was finished, the street was rebuilt on top of the new tunnel roof." },
];

const SOURCES = [
  { label: "Boston University: “125 Years Ago, Like Today, Many Bostonians Feared Their Subway System”", href: "https://www.bu.edu/articles/2022/125-years-ago-many-bostonians-feared-their-subway-system" },
  { label: "Wikipedia: Tremont Street subway", href: "https://en.wikipedia.org/wiki/Tremont_Street_subway" },
  { label: "Wikipedia: CharlieCard", href: "https://en.wikipedia.org/wiki/CharlieCard" },
  { label: "Wikipedia: “M.T.A.” (song)", href: "https://en.wikipedia.org/wiki/M.T.A._(song)" },
  { label: "Mass Moments: September 1, 1897", href: "https://www.massmoments.org/moment-details.html?mid=254" },
  { label: "ASCE: Boston Subway, a Historic Civil Engineering Landmark", href: "https://asce.org/about-civil-engineering/history-and-heritage/historic-landmarks/boston-subway" },
  { label: "Leventhal Map & Education Center: America’s First Subway", href: "https://www.leventhalmap.org/digital-exhibitions/getting-around-town/topics/americas-first-subway" },
  { label: "Mass.gov: Overview of the MBTA", href: "https://www.mass.gov/info-details/overview-of-the-massachusetts-bay-transportation-authority-0" },
];

const cardStyle = "rounded-[18px] border-4 border-[#172930] bg-[#fffdf1] shadow-[0_7px_0_#172930]";

function Photo({ photo, alt, caption, priority }: { photo: (typeof PHOTOS)[keyof typeof PHOTOS]; alt: string; caption: ReactNode; priority?: boolean }) {
  return (
    <figure className={`${cardStyle} overflow-hidden`}>
      <Image src={photo.src} width={photo.w} height={photo.h} alt={alt} sizes="(max-width: 900px) 100vw, 50vw" priority={priority} className="block h-auto w-full border-b-4 border-[#172930] grayscale-[15%]" />
      <figcaption className="px-4 py-3 text-sm leading-snug text-[#3f5258]">
        {caption}
        <span className="mt-1 block text-xs text-[#7a898d]">Photo: <a href={photo.source} target="_blank" rel="noreferrer" className="underline underline-offset-2">{photo.credit}</a> · public domain</span>
      </figcaption>
    </figure>
  );
}

function Section({ id, eyebrow, title, intro, tone = "plain", children }: { id: string; eyebrow: string; title: string; intro?: ReactNode; tone?: "plain" | "tint"; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className={`px-[clamp(20px,8vw,150px)] py-[60px] ${tone === "tint" ? "border-y-[5px] border-[#172930] bg-[#dce5df]" : ""}`}>
      <div className="section-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id}>{title}</h2>
        {intro && <p>{intro}</p>}
      </div>
      {children}
    </section>
  );
}

export default function HistoryPage() {
  return (
    <main className="history-page">
      <section className="history-hero">
        <span className="history-roundel">T</span>
        <div>
          <p className="eyebrow">The real system behind the game</p>
          <h1>Boston has always moved differently.</h1>
          <p>Horse cars, electric streetcars, and in 1897 the first subway in America. The tunnel those streetcars dove into still carries the Green Line today, making it the oldest subway tunnel in North America.</p>
        </div>
      </section>

      <Section
        id="why-title"
        eyebrow="1888 – 1895"
        title="Why Boston went underground"
        intro="By the 1890s Tremont Street was jammed with streetcars, wagons, and pedestrians. After the Blizzard of 1888 brought the city to a standstill, Massachusetts lawmakers authorized a tunnel to pull the streetcars off the street. The Boston Transit Commission oversaw the work, with Howard A. Carson as chief engineer."
      >
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
          <Photo
            photo={PHOTOS.church}
            priority
            alt="Construction fencing and work sheds along Tremont Street in front of Park Street Church"
            caption="Work sheds and fencing line Tremont Street in front of Park Street Church while the tunnel is dug below."
          />
          <div className={`${cardStyle} p-6`}>
            <h3 className="text-2xl font-black uppercase tracking-tight">Ground breaks in the Public Garden</h3>
            <p className="mt-2 leading-relaxed text-[#3f5258]">On <b>March 28, 1895</b>, the commission broke ground in the Public Garden near the corner of Boylston and Charles streets. Not everyone was convinced: newspapers warned that riding underground would be like “living in a tomb” and called the project “a menace to the health of the public.”</p>
            <p className="mt-3 leading-relaxed text-[#3f5258]">The dig also ran into the past. Along the Common, workers uncovered an old burial ground, and about <b>900 bodies</b> had to be carefully moved and reburied.</p>
          </div>
        </div>
      </Section>

      <Section
        id="build-title"
        eyebrow="1895 – 1897"
        title="How the first subway was built"
        intro="There were no tunnel-boring machines. The subway was built from the top down, one city block at a time, while the streets above stayed open."
        tone="tint"
      >
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BUILD_STEPS.map((step, i) => (
            <li key={step.title} className={`${cardStyle} p-5`}>
              <span className="grid h-10 w-10 place-items-center rounded-full border-4 border-[#172930] bg-[#f1be44] text-lg font-black">{i + 1}</span>
              <h3 className="mt-3 text-lg font-black">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#586b70]">{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
          <Photo
            photo={PHOTOS.dig}
            alt="Streetcars running on temporary tracks beside the open subway excavation along Boston Common"
            caption="Streetcars detour onto temporary “shoo-fly” tracks around the excavation for Park Street station, beside Boston Common."
          />
          <Photo
            photo={PHOTOS.explosion}
            alt="Wrecked streetcars and a crowd at Tremont and Boylston streets after the 1897 gas explosion"
            caption={<>Disaster struck on <b>March 4, 1897</b>: a gas pipe nicked during the work leaked under Tremont and Boylston streets, and a spark from a passing trolley set it off. The blast killed several people and injured dozens. The next day’s Boston Globe reported: “Subway Is Not Injured.”</>}
          />
        </div>
      </Section>

      <Section
        id="opening-title"
        eyebrow="September 1, 1897"
        title="Opening day"
        intro="Six months after the explosion, the first section opened on time and under budget. Streetcars entered at the Public Garden incline and ran underground to Park Street, with Boylston and Park Street among the very first subway stations in America."
      >
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
          <Photo
            photo={PHOTOS.opening}
            alt="Crowds and streetcars at the Public Garden subway entrance on opening day, September 1, 1897"
            caption="Crowds gather at the Public Garden entrance as streetcars, including one bound for Cambridge, head into the new tunnel on opening day."
          />
          <Photo
            photo={PHOTOS.elevated}
            alt="Blueprint-style photo of elevated railway tracks curving through Boston's South End in 1901"
            caption="Four years later, rapid transit took to the air: the Boston Elevated Railway’s new tracks curve through the South End in 1901 (an original cyanotype print)."
          />
        </div>
      </Section>

      <section className="history-timeline" aria-labelledby="timeline-title">
        <div className="section-heading">
          <p className="eyebrow">A line through time</p>
          <h2 id="timeline-title">Transit milestones</h2>
          <p>Scroll sideways through 130+ years of Boston transit.</p>
        </div>
        <div className="timeline-track" style={{ gridTemplateColumns: `repeat(${TIMELINE.length}, minmax(190px, 1fr))` }}>
          {TIMELINE.map((item) => <article key={item.year}><span>{item.year}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}
        </div>
      </section>

      <Section
        id="charlie-title"
        eyebrow="Fare history"
        title="Why is it called the CharlieCard?"
        intro="Your fare card is named after a fictional rider who never made it home: a folk-song hero from a 1949 Boston mayoral race."
        tone="tint"
      >
        <div className="mt-8 grid items-center gap-8 lg:grid-cols-[minmax(260px,1fr)_2fr]">
          <CharlieCardArt />
          <div className="space-y-4">
            <Fact title="1949 · A campaign song">
              Jacqueline Steiner and Bess Lomax Hawes wrote “M.T.A.” for Walter A. O’Brien, a Progressive Party candidate for mayor. O’Brien couldn’t afford radio ads, so folk singers performed his songs from a truck with a loudspeaker.
            </Fact>
            <Fact title="The protest · An extra nickel to get off">
              The song attacked a fare increase collected as an extra five-cent <b>exit fare</b>. Its hero, Charlie, boards a train but can’t pay to get off, so he rides beneath Boston forever while his wife hands him a sandwich through the window at Scollay Square, today’s Government Center.
            </Fact>
            <Fact title="1959 · A national hit">
              The Kingston Trio’s recording reached No. 15 on the Billboard Hot 100, and Charlie became Boston’s most famous straphanger.
            </Fact>
            <Fact title="2006 · Charlie finally gets a card">
              As a tribute, the MBTA named its electronic fare card after him. The Kingston Trio performed at the system’s 2004 dedication, and the CharlieCard replaced subway tokens on December 4, 2006. Since August 1, 2024, riders can also tap a bank card or phone.
            </Fact>
          </div>
        </div>
      </Section>

      <section className="line-history" aria-labelledby="line-title">
        <div className="section-heading">
          <p className="eyebrow">Four lines · four stories</p>
          <h2 id="line-title">The subway network</h2>
          <p>The game borrows these colors for difficulty themes; that fictional mapping does not describe real MBTA service difficulty.</p>
        </div>
        <div className="line-history-grid">
          {LINES.map((line) => <article key={line.name} style={{ "--history-line": line.color } as CSSProperties}><span className="line-history-badge">T</span><h3>{line.name}</h3><p>{line.text}</p></article>)}
        </div>
      </section>

      <section aria-labelledby="sources-title" className="px-[clamp(20px,8vw,150px)] py-[48px]">
        <h2 id="sources-title" className="text-xl font-black uppercase tracking-tight">Sources &amp; further reading</h2>
        <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
          {SOURCES.map((s) => (
            <li key={s.href}><a href={s.href} target="_blank" rel="noreferrer" className="font-semibold text-[#134e75] underline underline-offset-2">{s.label}</a></li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-[#7a898d]">Historical photos are in the public domain and come from the Library of Congress, Boston Public Library, and City of Boston Archives via Wikimedia Commons; each caption links to its source.</p>
      </section>
    </main>
  );
}

function Fact({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={`${cardStyle} p-5`}>
      <h3 className="text-sm font-black uppercase tracking-wide text-[#9a4c37]">{title}</h3>
      <p className="mt-1.5 leading-relaxed text-[#3f5258]">{children}</p>
    </div>
  );
}

/** A drawn (not photographed) CharlieCard in the site's style. */
function CharlieCardArt() {
  return (
    <div className="mx-auto w-full max-w-[340px] -rotate-3" aria-hidden="true">
      <div className="relative aspect-[1.586] overflow-hidden rounded-2xl border-4 border-[#172930] bg-gradient-to-br from-[#2f6fb5] to-[#1b4f8a] shadow-[0_10px_0_#172930]">
        <div className="absolute -right-6 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-full border-[3px] border-white bg-[#172930] text-2xl font-black text-white">T</div>
        <p className="absolute left-4 top-[4.4rem] text-3xl font-black italic tracking-tight text-white">CharlieCard</p>
        <p className="absolute bottom-4 left-4 text-xs font-semibold uppercase tracking-wider text-white/80">Boston’s transit pass</p>
        <div className="absolute bottom-3 right-4 h-8 w-10 rounded-md border-2 border-[#f1be44] bg-[#f1be44]/70" />
      </div>
      <p className="mt-5 text-center text-xs text-[#5f7075]">Illustration</p>
    </div>
  );
}
