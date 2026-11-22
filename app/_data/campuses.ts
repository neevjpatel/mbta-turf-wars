// One clearly different hue per campus so you can tell who owns which turf on the map.
// BU keeps its red and BC its gold; the others use distinct hues (their real colors are all reds).
export const CAMPUS_COLORS: Record<string, string> = {
  BU: "#CC0000",
  Northeastern: "#1BAF7A",
  MIT: "#7C5CD6",
  Harvard: "#E87BA4",
  BC: "#EDA100",
};

export const INITIAL_CAMPUS_STANDINGS: Record<string, number> = {
  BU: 140,
  Northeastern: 135,
  MIT: 120,
  Harvard: 110,
  BC: 105,
};
