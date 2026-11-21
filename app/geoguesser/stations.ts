import type { StaticImageData } from "next/image";
import allstonStreetOneImage from "../../geoguesser/allston_street_1_medium.png";
import allstonStreetTwoImage from "../../geoguesser/allston_street_2_easy.png";
import amoryStreetOneImage from "../../geoguesser/amory_street_1_medium.png";
import amoryStreetTwoImage from "../../geoguesser/amory_street_2_easy.png";
import amoryStreetThreeImage from "../../geoguesser/amory_street_3_hard.png";
import babcockCornerOneImage from "../../geoguesser/babcock_corner_1_medium.png";
import babcockStreetTwoImage from "../../geoguesser/babcock_street_2_easy.png";
import blandfordStreetOneImage from "../../geoguesser/blandford_street_1_hard.png";
import blandfordStreetTwoImage from "../../geoguesser/blandford_street_2_easy.png";
import bostonCollegeOneImage from "../../geoguesser/boston_college_1_medium.png";
import bostonCollegeTwoImage from "../../geoguesser/boston_college_2_hard.png";
import buCentralOneImage from "../../geoguesser/bu_central_1_easy.png";
import buCentralTwoImage from "../../geoguesser/bu_central_2_medium.png";
import buCentralThreeImage from "../../geoguesser/bu_central_3_extreme.png";
import buEastOneImage from "../../geoguesser/bu_east_1_easy.png";
import buEastTwoImage from "../../geoguesser/bu_east_2_medium.png";
import buEastThreeImage from "../../geoguesser/bu_east_3_extreme.png";
import chestnutHillOneImage from "../../geoguesser/chestnut_hill_1_easy.png";
import chestnutHillTwoImage from "../../geoguesser/chestnut_hill_2_extreme.png";
import chiswickRoadOneImage from "../../geoguesser/chiswick_road_1_hard.png";
import chiswickRoadTwoImage from "../../geoguesser/chiswick_road_2_extreme.png";
import griggsStreetOneImage from "../../geoguesser/griggs_street_1_extreme.png";
import griggsStreetTwoImage from "../../geoguesser/griggs_street_2_medium.png";
import griggsStreetThreeImage from "../../geoguesser/griggs_street_3_hard.png";
import harvardAveOneImage from "../../geoguesser/harvard_ave_1_hard.png";
import harvardAveTwoImage from "../../geoguesser/harvard_ave_2_easy.png";
import harvardAveThreeImage from "../../geoguesser/harvard_ave_3_extreme.png";
import kenmoreSquareOneImage from "../../geoguesser/kenmore_square_1_medium.png";
import kenmoreSquareTwoImage from "../../geoguesser/kenmore_square_2_medium.png";
import kenmoreSquareThreeImage from "../../geoguesser/kenmore_square_3_easy.png";
import packardsCornerOneImage from "../../geoguesser/packards_corner_1_easy.png";
import packardsCornerTwoImage from "../../geoguesser/packards_corner_2_medium.png";
import packardsCornerThreeImage from "../../geoguesser/packards_corner_3_hard.png";
import southStationOneImage from "../../geoguesser/south_station_1_hard.png";
import southStationTwoImage from "../../geoguesser/south_station_2_easy.png";
import southStationThreeImage from "../../geoguesser/south_station_3_medium.png";
import sutherlandRoadOneImage from "../../geoguesser/sutherland_road_1_easy.png";
import sutherlandRoadTwoImage from "../../geoguesser/sutherland_road_2_extreme.png";
import warrenStreetOneImage from "../../geoguesser/warren_street_1_easy.png";
import warrenStreetTwoImage from "../../geoguesser/warren_street_2_hard.png";
import washingtonStreetOneImage from "../../geoguesser/washington_street_1_extreme.png";
import washingtonStreetTwoImage from "../../geoguesser/washington_street_2_medium.png";

export type GameDifficulty = "easy" | "medium" | "hard" | "extreme";

export interface GeoGuessrStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface LocationImage {
  id: string;
  difficulties: GameDifficulty[];
  src: StaticImageData;
}

interface GeoGuessrLocation {
  id: string;
  stationId: string;
  images: LocationImage[];
}

export interface GameImage extends LocationImage {
  locationId: string;
  correctStationId: string;
}

export const GEOGUESSER_STATIONS: GeoGuessrStation[] = [
  { id: "place-river", name: "Riverside", lat: 42.337352, lng: -71.252685 },
  { id: "place-woodl", name: "Woodland", lat: 42.332902, lng: -71.243362 },
  { id: "place-waban", name: "Waban", lat: 42.325845, lng: -71.230609 },
  { id: "place-eliot", name: "Eliot", lat: 42.319045, lng: -71.216684 },
  { id: "place-newtn", name: "Newton Highlands", lat: 42.322381, lng: -71.205509 },
  { id: "place-newto", name: "Newton Centre", lat: 42.329443, lng: -71.192414 },
  { id: "place-chhil", name: "Chestnut Hill", lat: 42.326753, lng: -71.164699 },
  { id: "place-rsmnl", name: "Reservoir", lat: 42.335088, lng: -71.148758 },
  { id: "place-bcnfd", name: "Beaconsfield", lat: 42.335765, lng: -71.140455 },
  { id: "place-brkhl", name: "Brookline Hills", lat: 42.331316, lng: -71.126683 },
  { id: "place-bvmnl", name: "Brookline Village", lat: 42.332608, lng: -71.116857 },
  { id: "place-longw", name: "Longwood", lat: 42.341702, lng: -71.109956 },
  { id: "place-fenwy", name: "Fenway", lat: 42.345403, lng: -71.104213 },
  { id: "place-lake", name: "Boston College", lat: 42.340081, lng: -71.166769 },
  { id: "place-sougr", name: "South Street", lat: 42.3396, lng: -71.157661 },
  { id: "place-chill", name: "Chestnut Hill Avenue", lat: 42.338169, lng: -71.15316 },
  { id: "place-chswk", name: "Chiswick Road", lat: 42.340805, lng: -71.150711 },
  { id: "place-sthld", name: "Sutherland Road", lat: 42.341614, lng: -71.146202 },
  { id: "place-wascm", name: "Washington Street", lat: 42.343864, lng: -71.142853 },
  { id: "place-wrnst", name: "Warren Street", lat: 42.348343, lng: -71.140457 },
  { id: "place-alsgr", name: "Allston Street", lat: 42.348701, lng: -71.137955 },
  { id: "place-grigg", name: "Griggs Street", lat: 42.348545, lng: -71.134949 },
  { id: "place-harvd", name: "Harvard Avenue", lat: 42.350243, lng: -71.131355 },
  { id: "place-brico", name: "Packard's Corner", lat: 42.351967, lng: -71.125031 },
  { id: "place-babck", name: "Babcock Street", lat: 42.351616, lng: -71.119924 },
  { id: "place-amory", name: "Amory Street", lat: 42.350992, lng: -71.114748 },
  { id: "place-bucen", name: "Boston University Central", lat: 42.350082, lng: -71.106865 },
  { id: "place-buest", name: "Boston University East", lat: 42.349735, lng: -71.103889 },
  { id: "place-bland", name: "Blandford Street", lat: 42.349293, lng: -71.100258 },
  { id: "place-clmnl", name: "Cleveland Circle", lat: 42.336142, lng: -71.149326 },
  { id: "place-engav", name: "Englewood Avenue", lat: 42.337104, lng: -71.144852 },
  { id: "place-denrd", name: "Dean Road", lat: 42.337656, lng: -71.142156 },
  { id: "place-tapst", name: "Tappan Street", lat: 42.338459, lng: -71.138702 },
  { id: "place-bcnwa", name: "Washington Square", lat: 42.339394, lng: -71.13533 },
  { id: "place-fbkst", name: "Fairbanks Street", lat: 42.339725, lng: -71.131073 },
  { id: "place-bndhl", name: "Brandon Hall", lat: 42.340013, lng: -71.128701 },
  { id: "place-sumav", name: "Summit Avenue", lat: 42.34111, lng: -71.12561 },
  { id: "place-cool", name: "Coolidge Corner", lat: 42.342116, lng: -71.121263 },
  { id: "place-stpul", name: "Saint Paul Street", lat: 42.343327, lng: -71.116997 },
  { id: "place-kntst", name: "Kent Street", lat: 42.344074, lng: -71.114197 },
  { id: "place-hwsst", name: "Hawes Street", lat: 42.344906, lng: -71.111145 },
  { id: "place-smary", name: "Saint Mary's Street", lat: 42.345974, lng: -71.107353 },
  { id: "place-kencl", name: "Kenmore", lat: 42.348949, lng: -71.095169 },
  { id: "place-hymnl", name: "Hynes Convention Center", lat: 42.347888, lng: -71.087903 },
  { id: "place-hsmnl", name: "Heath Street", lat: 42.328316, lng: -71.110252 },
  { id: "place-bckhl", name: "Back of the Hill", lat: 42.330139, lng: -71.111313 },
  { id: "place-rvrwy", name: "Riverway", lat: 42.331684, lng: -71.111931 },
  { id: "place-mispk", name: "Mission Park", lat: 42.333195, lng: -71.109756 },
  { id: "place-fenwd", name: "Fenwood Road", lat: 42.333706, lng: -71.105728 },
  { id: "place-brmnl", name: "Brigham Circle", lat: 42.334229, lng: -71.104609 },
  { id: "place-lngmd", name: "Longwood Medical Area", lat: 42.33596, lng: -71.100052 },
  { id: "place-mfa", name: "Museum of Fine Arts", lat: 42.337711, lng: -71.095512 },
  { id: "place-nuniv", name: "Northeastern University", lat: 42.340401, lng: -71.088806 },
  { id: "place-symcl", name: "Symphony", lat: 42.342687, lng: -71.085056 },
  { id: "place-prmnl", name: "Prudential", lat: 42.34557, lng: -71.081696 },
  { id: "place-coecl", name: "Copley", lat: 42.349974, lng: -71.077447 },
  { id: "place-armnl", name: "Arlington", lat: 42.351902, lng: -71.070893 },
  { id: "place-boyls", name: "Boylston", lat: 42.35302, lng: -71.06459 },
  { id: "place-brntn", name: "Braintree", lat: 42.2078543, lng: -71.0011385 },
  { id: "place-qamnl", name: "Quincy Adams", lat: 42.233391, lng: -71.007153 },
  { id: "place-qnctr", name: "Quincy Center", lat: 42.251809, lng: -71.005409 },
  { id: "place-wlsta", name: "Wollaston", lat: 42.2665139, lng: -71.0203369 },
  { id: "place-nqncy", name: "North Quincy", lat: 42.275275, lng: -71.029583 },
  { id: "place-asmnl", name: "Ashmont", lat: 42.28452, lng: -71.063777 },
  { id: "place-smmnl", name: "Shawmut", lat: 42.2931258, lng: -71.065738 },
  { id: "place-fldcr", name: "Fields Corner", lat: 42.300093, lng: -71.061667 },
  { id: "place-shmnl", name: "Savin Hill", lat: 42.31129, lng: -71.053331 },
  { id: "place-jfk", name: "JFK/UMass", lat: 42.320685, lng: -71.052391 },
  { id: "place-andrw", name: "Andrew", lat: 42.330154, lng: -71.057655 },
  { id: "place-brdwy", name: "Broadway", lat: 42.342622, lng: -71.056967 },
  { id: "place-sstat", name: "South Station", lat: 42.352271, lng: -71.055242 },
  { id: "place-forhl", name: "Forest Hills", lat: 42.300713, lng: -71.113943 },
  { id: "place-grnst", name: "Green Street", lat: 42.310525, lng: -71.107414 },
  { id: "place-sbmnl", name: "Stony Brook", lat: 42.317062, lng: -71.104248 },
  { id: "place-jaksn", name: "Jackson Square", lat: 42.323132, lng: -71.099592 },
  { id: "place-rcmnl", name: "Roxbury Crossing", lat: 42.331397, lng: -71.095451 },
  { id: "place-rugg", name: "Ruggles", lat: 42.336377, lng: -71.088961 },
  { id: "place-masta", name: "Massachusetts Avenue", lat: 42.341512, lng: -71.083423 },
  { id: "place-bbsta", name: "Back Bay", lat: 42.34735, lng: -71.075727 },
  { id: "place-tumnl", name: "Tufts Medical Center", lat: 42.349662, lng: -71.063917 },
  { id: "place-chncl", name: "Chinatown", lat: 42.352547, lng: -71.062752 },
  { id: "place-dwnxg", name: "Downtown Crossing", lat: 42.355518, lng: -71.060225 },
  { id: "place-wondl", name: "Wonderland", lat: 42.41342, lng: -70.991648 },
  { id: "place-rbmnl", name: "Revere Beach", lat: 42.4078425, lng: -70.9925332 },
  { id: "place-bmmnl", name: "Beachmont", lat: 42.3975423, lng: -70.9923194 },
  { id: "place-sdmnl", name: "Suffolk Downs", lat: 42.3905007, lng: -70.9971226 },
  { id: "place-orhte", name: "Orient Heights", lat: 42.386867, lng: -71.004736 },
  { id: "place-wimnl", name: "Wood Island", lat: 42.3796403, lng: -71.0228654 },
  { id: "place-aport", name: "Airport", lat: 42.374262, lng: -71.030395 },
  { id: "place-mvbcl", name: "Maverick", lat: 42.3691186, lng: -71.0395296 },
  { id: "place-aqucl", name: "Aquarium", lat: 42.359784, lng: -71.051652 },
  { id: "place-state", name: "State", lat: 42.358978, lng: -71.057598 },
  { id: "place-pktrm", name: "Park Street", lat: 42.3563946, lng: -71.0624242 },
  { id: "place-alfcl", name: "Alewife", lat: 42.39583, lng: -71.141287 },
  { id: "place-davis", name: "Davis", lat: 42.39674, lng: -71.121815 },
  { id: "place-portr", name: "Porter", lat: 42.3884, lng: -71.119149 },
  { id: "place-harsq", name: "Harvard", lat: 42.373362, lng: -71.118956 },
  { id: "place-cntsq", name: "Central", lat: 42.365486, lng: -71.103802 },
  { id: "place-knncl", name: "Kendall/MIT", lat: 42.3624908, lng: -71.0861765 },
  { id: "place-chmnl", name: "Charles/MGH", lat: 42.361166, lng: -71.070628 },
  { id: "place-bomnl", name: "Bowdoin", lat: 42.361365, lng: -71.062037 },
  { id: "place-gover", name: "Government Center", lat: 42.359705, lng: -71.059215 },
  { id: "place-haecl", name: "Haymarket", lat: 42.363021, lng: -71.05829 },
  { id: "place-north", name: "North Station", lat: 42.365577, lng: -71.06129 },
  { id: "place-ccmnl", name: "Community College", lat: 42.373622, lng: -71.069533 },
  { id: "place-sull", name: "Sullivan Square", lat: 42.383975, lng: -71.076994 },
  { id: "place-astao", name: "Assembly", lat: 42.392811, lng: -71.077257 },
  { id: "place-welln", name: "Wellington", lat: 42.40237, lng: -71.077082 },
  { id: "place-mlmnl", name: "Malden Center", lat: 42.426632, lng: -71.07411 },
  { id: "place-ogmnl", name: "Oak Grove", lat: 42.43668, lng: -71.071097 },
  { id: "place-spmnl", name: "Science Park/West End", lat: 42.366664, lng: -71.067666 },
  { id: "place-lech", name: "Lechmere", lat: 42.371572, lng: -71.076584 },
  { id: "place-esomr", name: "East Somerville", lat: 42.379467, lng: -71.086625 },
  { id: "place-gilmn", name: "Gilman Square", lat: 42.387928, lng: -71.096766 },
  { id: "place-mgngl", name: "Magoun Square", lat: 42.393682, lng: -71.1063879 },
  { id: "place-balsq", name: "Ball Square", lat: 42.399889, lng: -71.111003 },
  { id: "place-mdftf", name: "Medford/Tufts", lat: 42.407975, lng: -71.117044 },
  { id: "place-unsqu", name: "Union Square", lat: 42.377359, lng: -71.094761 },
];

const GEOGUESSER_LOCATIONS: GeoGuessrLocation[] = [
  { id: "allston_street", stationId: "place-alsgr", images: [
    { id: "allston_street_1_medium", difficulties: ["medium"], src: allstonStreetOneImage },
    { id: "allston_street_2_easy", difficulties: ["easy"], src: allstonStreetTwoImage },
  ] },
  { id: "amory_street", stationId: "place-amory", images: [
    { id: "amory_street_1_medium", difficulties: ["medium"], src: amoryStreetOneImage },
    { id: "amory_street_2_easy", difficulties: ["easy"], src: amoryStreetTwoImage },
    { id: "amory_street_3_hard", difficulties: ["hard"], src: amoryStreetThreeImage },
  ] },
  { id: "babcock_street", stationId: "place-babck", images: [
    { id: "babcock_corner_1_medium", difficulties: ["medium"], src: babcockCornerOneImage },
    { id: "babcock_street_2_easy", difficulties: ["easy"], src: babcockStreetTwoImage },
  ] },
  { id: "blandford_street", stationId: "place-bland", images: [
    { id: "blandford_street_1_hard", difficulties: ["hard"], src: blandfordStreetOneImage },
    { id: "blandford_street_2_easy", difficulties: ["easy"], src: blandfordStreetTwoImage },
  ] },
  { id: "boston_college", stationId: "place-lake", images: [
    { id: "boston_college_1_medium", difficulties: ["medium"], src: bostonCollegeOneImage },
    { id: "boston_college_2_hard", difficulties: ["hard"], src: bostonCollegeTwoImage },
  ] },
  { id: "bu_central", stationId: "place-bucen", images: [
    { id: "bu_central_1_easy", difficulties: ["easy"], src: buCentralOneImage },
    { id: "bu_central_2_medium", difficulties: ["medium"], src: buCentralTwoImage },
    { id: "bu_central_3_extreme", difficulties: ["extreme"], src: buCentralThreeImage },
  ] },
  { id: "bu_east", stationId: "place-buest", images: [
    { id: "bu_east_1_easy", difficulties: ["easy"], src: buEastOneImage },
    { id: "bu_east_2_medium", difficulties: ["medium"], src: buEastTwoImage },
    { id: "bu_east_3_extreme", difficulties: ["extreme"], src: buEastThreeImage },
  ] },
  { id: "chestnut_hill", stationId: "place-chill", images: [
    { id: "chestnut_hill_1_easy", difficulties: ["easy"], src: chestnutHillOneImage },
    { id: "chestnut_hill_2_extreme", difficulties: ["extreme"], src: chestnutHillTwoImage },
  ] },
  { id: "chiswick_road", stationId: "place-chswk", images: [
    { id: "chiswick_road_1_hard", difficulties: ["hard"], src: chiswickRoadOneImage },
    { id: "chiswick_road_2_extreme", difficulties: ["extreme"], src: chiswickRoadTwoImage },
  ] },
  { id: "griggs_street", stationId: "place-grigg", images: [
    { id: "griggs_street_1_extreme", difficulties: ["extreme"], src: griggsStreetOneImage },
    { id: "griggs_street_2_medium", difficulties: ["medium"], src: griggsStreetTwoImage },
    { id: "griggs_street_3_hard", difficulties: ["hard"], src: griggsStreetThreeImage },
  ] },
  { id: "harvard_ave", stationId: "place-harvd", images: [
    { id: "harvard_ave_1_hard", difficulties: ["hard"], src: harvardAveOneImage },
    { id: "harvard_ave_2_easy", difficulties: ["easy"], src: harvardAveTwoImage },
    { id: "harvard_ave_3_extreme", difficulties: ["extreme"], src: harvardAveThreeImage },
  ] },
  { id: "kenmore_square", stationId: "place-kencl", images: [
    { id: "kenmore_square_1_medium", difficulties: ["medium"], src: kenmoreSquareOneImage },
    { id: "kenmore_square_2_medium", difficulties: ["medium"], src: kenmoreSquareTwoImage },
    { id: "kenmore_square_3_easy", difficulties: ["easy"], src: kenmoreSquareThreeImage },
  ] },
  { id: "packards_corner", stationId: "place-brico", images: [
    { id: "packards_corner_1_easy", difficulties: ["easy"], src: packardsCornerOneImage },
    { id: "packards_corner_2_medium", difficulties: ["medium"], src: packardsCornerTwoImage },
    { id: "packards_corner_3_hard", difficulties: ["hard"], src: packardsCornerThreeImage },
  ] },
  { id: "south_station", stationId: "place-sstat", images: [
    { id: "south_station_1_hard", difficulties: ["hard"], src: southStationOneImage },
    { id: "south_station_2_easy", difficulties: ["easy"], src: southStationTwoImage },
    { id: "south_station_3_medium", difficulties: ["medium"], src: southStationThreeImage },
  ] },
  { id: "sutherland_road", stationId: "place-sthld", images: [
    { id: "sutherland_road_1_easy", difficulties: ["easy"], src: sutherlandRoadOneImage },
    { id: "sutherland_road_2_extreme", difficulties: ["extreme"], src: sutherlandRoadTwoImage },
  ] },
  { id: "warren_street", stationId: "place-wrnst", images: [
    { id: "warren_street_1_easy", difficulties: ["easy"], src: warrenStreetOneImage },
    { id: "warren_street_2_hard", difficulties: ["hard"], src: warrenStreetTwoImage },
  ] },
  { id: "washington_street", stationId: "place-wascm", images: [
    { id: "washington_street_1_extreme", difficulties: ["extreme"], src: washingtonStreetOneImage },
    { id: "washington_street_2_medium", difficulties: ["medium"], src: washingtonStreetTwoImage },
  ] },
];

export const GEOGUESSER_IMAGES: GameImage[] = GEOGUESSER_LOCATIONS.flatMap((location) =>
  location.images.map((image) => ({ ...image, locationId: location.id, correctStationId: location.stationId }))
);

export const GEOGUESSER_DIFFICULTIES: Record<GameDifficulty, GameImage[]> = {
  easy: GEOGUESSER_IMAGES.filter((image) => image.difficulties.includes("easy")),
  medium: GEOGUESSER_IMAGES.filter((image) => image.difficulties.includes("medium")),
  hard: GEOGUESSER_IMAGES.filter((image) => image.difficulties.includes("hard")),
  extreme: GEOGUESSER_IMAGES.filter((image) => image.difficulties.includes("extreme")),
};
