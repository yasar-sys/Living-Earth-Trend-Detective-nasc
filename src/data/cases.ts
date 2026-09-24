import type { LayerId } from "./nasa-datasets";

export interface CaseSpec {
  id: string;
  kicker: string;
  title: string;
  narrative: string;
  mechanism: string;
  layer: LayerId;
  left: { regionId: string; label: string; window?: [number, number] };
  right: { regionId: string; label: string; window?: [number, number] };
}

export const CASES: CaseSpec[] = [
  {
    id: "two-poles",
    kicker: "Case 01",
    title: "Two poles, two verdicts",
    narrative:
      "Satellites have watched both polar oceans with the same instruments since 1979. The Arctic answer is blunt: September ice is disappearing, and the Mann–Kendall test rejects noise outright. Then you turn the globe over. For three decades Antarctic sea ice drifted slightly upward — enough that people argued the ice wasn't really in trouble. Same planet, same warming, opposite signs. Only one of these is a strong statistical trend, and that difference is the whole case.",
    mechanism:
      "The Arctic is an ocean ringed by land, so warm water and warm air are trapped against the ice and thinning it year after year. Antarctic sea ice is a thin skirt floating on the open Southern Ocean, and it is governed less by temperature than by wind and by the fresh, cold meltwater spilling off the ice sheet. Strengthening westerly winds pushed ice outward and freshwater capped the surface, holding extent up — until 2016, when Antarctic extent fell off a cliff and the earlier 'growth' was revealed as a weak, wind-driven wobble on top of a warming ocean.",
    layer: "seaice",
    left: { regionId: "arctic-ocean", label: "Central Arctic Ocean" },
    right: { regionId: "ross-sea", label: "Ross Sea (Antarctic)" },
  },
  {
    id: "southern-lag",
    kicker: "Case 02",
    title: "The corner of the world that refuses to warm",
    narrative:
      "Pick the Siberian Arctic and the trend is unmissable — the surface is warming several times faster than the global average and the test returns a vanishingly small p-value. Pick the Southern Ocean and the same layer, the same years, the same method returns something much flatter. A sceptic reads that as proof warming isn't global. A detective reads the p-value and the physics instead.",
    mechanism:
      "Both regions are responding to the same extra energy — it just goes to different places. Over Siberia, heat stays in a shallow layer of air and is amplified by vanishing snow and ice, which darkens the surface and traps even more heat. In the Southern Ocean, the same heat is stirred downward: upwelling brings century-old water to the surface and currents carry the warmed water into the deep ocean, so the surface temperature barely budges while the heat is quietly banked below. Slow surface warming there is evidence of a heat sink, not of an absent trend.",
    layer: "temperature",
    left: { regionId: "siberia", label: "Siberia" },
    right: { regionId: "southern-ocean", label: "Southern Ocean" },
  },
];

