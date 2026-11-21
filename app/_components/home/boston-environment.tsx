function SkylineScene() {
  return (
    <svg viewBox="0 0 1600 420" preserveAspectRatio="none" focusable="false">
      <defs><linearGradient id="skyline-haze" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8099a8" /><stop offset="1" stopColor="#526d7b" /></linearGradient></defs>
      <path d="M0 370V286h92v-50h74v46h84V205h96v77h58v-48h91v48h48V142h32v-42h43v42h34v140h77v-86h107v86h62V174h34v-72h34V52h31v50h35v72h59v108h71v-58h112v58h62v-99h105v187Z" fill="url(#skyline-haze)" />
      <path d="M1124 370V226m0 0 92-124m-92 124 151-96m-59-28 73 268m-165-144h207" fill="none" stroke="#b7c6cd" strokeWidth="8" opacity=".72" />
      <path d="M1118 231h220M1146 202h164M1170 172h113" fill="none" stroke="#607784" strokeWidth="3" opacity=".8" />
      <g fill="#f5ce79" opacity=".68">{Array.from({ length: 18 }, (_, index) => <rect key={index} x={270 + index * 58} y={242 - (index % 3) * 28} width="9" height="14" rx="2" />)}</g>
      <path d="M682 282v-51h104v51M696 231q38-72 76 0" fill="#9b7960" stroke="#e1b858" strokeWidth="6" />
      <circle cx="734" cy="177" r="7" fill="#e9c45f" />
    </svg>
  );
}

function NeighborhoodScene() {
  const windows = Array.from({ length: 35 }, (_, index) => {
    const block = Math.floor(index / 7);
    return <rect key={index} x={34 + (index % 7) * 46 + block * 320} y={274 + (index % 2) * 52} width="22" height="34" rx="4" />;
  });
  return (
    <svg viewBox="0 0 1600 420" preserveAspectRatio="none" focusable="false">
      <defs>
        <linearGradient id="brick-a" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b96e4e" /><stop offset="1" stopColor="#784536" /></linearGradient>
        <linearGradient id="brick-b" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d08b61" /><stop offset="1" stopColor="#8d5141" /></linearGradient>
      </defs>
      <path d="M0 420V240h92v-45h123v225Zm230 0V214h172v206Zm425 0V232h153v188Zm742 0V206h189v214Z" fill="url(#brick-a)" stroke="#60362e" strokeWidth="6" />
      <path d="m92 195 123 0-62-51Zm138 19h172l-86-62Zm425 18h153l-76-65Zm742-26h189l-95-63Z" fill="#53423d" stroke="#3e302d" strokeWidth="5" />
      <path d="M420 420V267h211v153Zm405 0V242h210v178Zm226 0V281h181v139Zm196 0V246h132v174Z" fill="url(#brick-b)" stroke="#694136" strokeWidth="6" />
      <g fill="#f5d7a1" stroke="#604a3c" strokeWidth="4">{windows}</g>
      <g fill="#314450"><rect x="292" y="302" width="42" height="118" rx="20" /><rect x="905" y="305" width="44" height="115" rx="20" /><rect x="1464" y="294" width="44" height="126" rx="20" /></g>
      <g stroke="#f3c677" strokeWidth="3" opacity=".8"><path d="M0 262h215M230 250h172M420 300h211M655 270h153M825 278h210M1051 309h181M1247 280h132M1397 246h189" /></g>
    </svg>
  );
}

function NearScene() {
  return (
    <svg viewBox="0 0 1600 420" preserveAspectRatio="none" focusable="false">
      <defs><radialGradient id="leaf" cx="35%" cy="30%"><stop stopColor="#82a657" /><stop offset="1" stopColor="#315c42" /></radialGradient></defs>
      <path d="M0 330q180-42 360 0t360 0 360 0 360 0v90H0Z" fill="#6c9361" opacity=".82" />
      <g fill="url(#leaf)" stroke="#294b39" strokeWidth="5"><path d="M25 278q-28-75 52-94-2-72 78-65 70 9 63 78 71 25 31 92Z" /><path d="M438 281q-35-73 45-98 6-79 88-69 71 13 57 82 72 29 24 96Z" /><path d="M965 286q-34-81 53-102 2-78 86-66 73 14 55 83 74 27 29 96Z" /><path d="M1420 280q-29-75 51-95 3-72 79-65 67 12 56 77 65 27 27 91Z" /></g>
      <g fill="#513d2e"><path d="M118 250h18l18 170H94Z" /><path d="M532 247h18l18 173h-61Z" /><path d="M1068 247h18l18 173h-60Z" /><path d="M1512 245h18l18 175h-59Z" /></g>
      <g fill="none" stroke="#45555a" strokeWidth="9"><path d="M322 420V151q0-33 33-33h31" /><path d="M830 420V143q0-33 33-33h31" /><path d="M1320 420V157q0-33 33-33h31" /></g>
      <g fill="#ffe8a6" stroke="#4a555a" strokeWidth="5"><circle cx="391" cy="118" r="17" /><circle cx="899" cy="110" r="17" /><circle cx="1389" cy="124" r="17" /></g>
      <path d="M665 420V164h11v256m-42-238h84M1432 420V147h11v273m-42-255h84" stroke="#46545a" strokeWidth="7" />
      <path d="M0 365h1600" stroke="#d8dfd9" strokeWidth="8" opacity=".8" />
    </svg>
  );
}

function RepeatingLayer({ className, children }: { className: string; children: React.ReactNode }) {
  return <div className={`environment-layer ${className}`}><div className="environment-strip"><div className="environment-scene">{children}</div><div className="environment-scene">{children}</div></div></div>;
}

export default function BostonEnvironment() {
  return (
    <div className="boston-environment" aria-hidden="true">
      <div className="sun-glow" />
      <div className="environment-sky"><span className="cloud cloud-one" /><span className="cloud cloud-two" /><span className="cloud cloud-three" /></div>
      <RepeatingLayer className="skyline-layer"><SkylineScene /></RepeatingLayer>
      <div className="charles-river"><i /><i /><i /></div>
      <RepeatingLayer className="neighborhood-layer"><NeighborhoodScene /></RepeatingLayer>
      <RepeatingLayer className="near-layer"><NearScene /></RepeatingLayer>
      <RepeatingLayer className="rail-layer"><svg viewBox="0 0 1600 150" preserveAspectRatio="none" focusable="false"><rect y="57" width="1600" height="93" fill="#4a5352" /><path d="M0 74h1600M0 121h1600" stroke="#d9e0dc" strokeWidth="10" /><path d="M0 98h1600" stroke="#202728" strokeWidth="26" strokeDasharray="20 34" /><path d="M0 44h1600" stroke="#788482" strokeWidth="4" /><path d="M0 64h1600" stroke="#1f2829" strokeWidth="3" opacity=".7" /></svg></RepeatingLayer>
      <div className="tunnel-vignette" />
    </div>
  );
}
