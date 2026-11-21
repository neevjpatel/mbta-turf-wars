function SkylineScene() {
  return (
    <svg viewBox="0 0 1600 420" preserveAspectRatio="none" focusable="false">
      <path d="M0 350V245h95v-42h78v67h62V178h88v88h65V222h92v48h54V138h42v-36h38v36h43v132h72v-75h105v75h54V160h45v-58h34V64h28v38h36v58h61v110h70v-51h116v51h75v-92h93v172Z" fill="#344655" />
      <path d="M915 350V236m0 0 76-116m-76 116 128-88m-52-28 70 230m-146-114h184" fill="none" stroke="#617381" strokeWidth="8" opacity=".75" />
      <g fill="#d5b36a" opacity=".45">
        <rect x="258" y="203" width="8" height="10" /><rect x="286" y="203" width="8" height="10" /><rect x="548" y="164" width="8" height="10" /><rect x="580" y="164" width="8" height="10" /><rect x="1222" y="202" width="8" height="10" /><rect x="1252" y="202" width="8" height="10" />
      </g>
    </svg>
  );
}

function NeighborhoodScene() {
  return (
    <svg viewBox="0 0 1600 420" preserveAspectRatio="none" focusable="false">
      <g>
        <path d="M0 420V245h95v-42h112v217Zm215 0V214h174v206Zm403 0V229h142v191Zm772 0V204h180v216Z" fill="#74483c" />
        <path d="M95 203h112l-56-48Zm120 11h174l-87-55Zm403 15h142l-71-61Zm772-25h180l-90-57Z" fill="#3d3432" />
        <path d="M408 420V270h190v150Zm370 0V238h214v182Zm234 0V278h174v142Zm180 0V244h176v176Z" fill="#8a5948" />
        <g fill="#d5bf8a" opacity=".7">
          {Array.from({ length: 28 }, (_, index) => {
            const group = Math.floor(index / 7);
            return <rect key={index} x={28 + (index % 7) * 52 + group * 392} y={270 + (index % 2) * 55} width="22" height="31" rx="2" />;
          })}
        </g>
        <g stroke="#4c3029" strokeWidth="3" opacity=".6">
          {Array.from({ length: 13 }, (_, index) => <path key={index} d={`M${index * 128} 250v170`} />)}
        </g>
      </g>
    </svg>
  );
}

function NearScene() {
  return (
    <svg viewBox="0 0 1600 420" preserveAspectRatio="none" focusable="false">
      <g fill="#294b3d">
        <circle cx="90" cy="220" r="58" /><circle cx="151" cy="236" r="48" /><circle cx="520" cy="205" r="62" /><circle cx="580" cy="230" r="52" /><circle cx="1080" cy="224" r="66" /><circle cx="1150" cy="235" r="45" /><circle cx="1510" cy="218" r="62" />
      </g>
      <g fill="#1e2928"><rect x="85" y="220" width="12" height="200" /><rect x="515" y="205" width="12" height="215" /><rect x="1075" y="224" width="12" height="196" /><rect x="1505" y="218" width="12" height="202" /></g>
      <g fill="none" stroke="#59656a" strokeWidth="7">
        <path d="M300 420V145q0-30 30-30h25" /><path d="M820 420V135q0-30 30-30h25" /><path d="M1320 420V152q0-30 30-30h25" />
      </g>
      <g fill="#ffe8a6"><circle cx="360" cy="116" r="13" /><circle cx="880" cy="106" r="13" /><circle cx="1380" cy="123" r="13" /></g>
      <g stroke="#41494d" strokeWidth="6"><path d="M690 420V105M650 156h82M1435 420V88M1395 140h82" /></g>
      <g stroke="#596267" strokeWidth="2" opacity=".7"><path d="M650 156 300 190M732 156l88 55M1395 140 880 174M1477 140l123 35" /></g>
    </svg>
  );
}

function RepeatingLayer({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div className={`environment-layer ${className}`}>
      <div className="environment-strip"><div className="environment-scene">{children}</div><div className="environment-scene">{children}</div></div>
    </div>
  );
}

export default function BostonEnvironment() {
  return (
    <div className="boston-environment" aria-hidden="true">
      <div className="environment-sky">
        <span className="cloud cloud-one" /><span className="cloud cloud-two" /><span className="cloud cloud-three" />
      </div>
      <RepeatingLayer className="skyline-layer"><SkylineScene /></RepeatingLayer>
      <RepeatingLayer className="neighborhood-layer"><NeighborhoodScene /></RepeatingLayer>
      <RepeatingLayer className="near-layer"><NearScene /></RepeatingLayer>
      <RepeatingLayer className="rail-layer">
        <svg viewBox="0 0 1600 150" preserveAspectRatio="none" focusable="false">
          <rect y="65" width="1600" height="85" fill="#20262a" />
          <path d="M0 74h1600M0 116h1600" stroke="#aeb6b9" strokeWidth="9" />
          <path d="M0 94h1600" stroke="#0b0f11" strokeWidth="5" strokeDasharray="16 34" />
          <path d="M0 44h1600" stroke="#6f777b" strokeWidth="3" />
        </svg>
      </RepeatingLayer>
      <div className="tunnel-vignette" />
    </div>
  );
}
