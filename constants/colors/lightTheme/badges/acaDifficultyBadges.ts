import {
  AcaRiskSubRating,
  AcaTechnicalSubRating,
  AcaTimeSubRating,
  AcaWaterSubRating,
} from "ropegeo-common/models";

import type {
  DifficultyRatingBadgeColors,
  DifficultySubRating,
} from "../../types";

/** Default main icon tint from {@link Badge} (`iconColor` default). */
const DEFAULT_RATING_ICON = "#000000";

const greenBackground = "#22c55e";
const yellowBackground = "#eab308";
const orangeBackground = "#f97316";
const redBackground = "#ef4444";
const blackBackground = "#000000";

export const acaDifficultyBadges = {
  [AcaTechnicalSubRating.One]: {
    background: greenBackground,
    icon: DEFAULT_RATING_ICON,
  },
  [AcaTechnicalSubRating.Two]: {
    background: yellowBackground,
    icon: DEFAULT_RATING_ICON,
  },
  [AcaTechnicalSubRating.Three]: {
    background: orangeBackground,
    icon: DEFAULT_RATING_ICON,
  },
  [AcaTechnicalSubRating.Four]: {
    background: redBackground,
    icon: DEFAULT_RATING_ICON,
  },
  [AcaWaterSubRating.A]: {
    background: greenBackground,
    icon: DEFAULT_RATING_ICON,
  },
  [AcaWaterSubRating.B]: {
    background: yellowBackground,
    icon: DEFAULT_RATING_ICON,
  },
  [AcaWaterSubRating.C]: {
    background: redBackground,
    icon: DEFAULT_RATING_ICON,
  },
  [AcaWaterSubRating.C1]: {
    background: yellowBackground,
    icon: DEFAULT_RATING_ICON,
  },
  [AcaWaterSubRating.C2]: {
    background: orangeBackground,
    icon: DEFAULT_RATING_ICON,
  },
  [AcaWaterSubRating.C3]: {
    background: redBackground,
    icon: DEFAULT_RATING_ICON,
  },
  [AcaWaterSubRating.C4]: {
    background: blackBackground,
    icon: redBackground,
  },
  [AcaTimeSubRating.I]: {
    background: greenBackground,
    icon: DEFAULT_RATING_ICON,
  },
  [AcaTimeSubRating.II]: {
    background: yellowBackground,
    icon: DEFAULT_RATING_ICON,
  },
  [AcaTimeSubRating.III]: {
    background: yellowBackground,
    icon: DEFAULT_RATING_ICON,
  },
  [AcaTimeSubRating.IV]: {
    background: orangeBackground,
    icon: DEFAULT_RATING_ICON,
  },
  [AcaTimeSubRating.V]: {
    background: redBackground,
    icon: DEFAULT_RATING_ICON,
  },
  [AcaTimeSubRating.VI]: {
    background: redBackground,
    icon: DEFAULT_RATING_ICON,
  },
  [AcaRiskSubRating.G]: {
    background: greenBackground,
    icon: DEFAULT_RATING_ICON,
  },
  [AcaRiskSubRating.PG]: {
    background: yellowBackground,
    icon: DEFAULT_RATING_ICON,
  },
  [AcaRiskSubRating.PG13]: {
    background: orangeBackground,
    icon: DEFAULT_RATING_ICON,
  },
  [AcaRiskSubRating.R]: {
    background: redBackground,
    icon: DEFAULT_RATING_ICON,
  },
  [AcaRiskSubRating.X]: {
    background: blackBackground,
    icon: redBackground,
  },
  [AcaRiskSubRating.XX]: {
    background: blackBackground,
    icon: redBackground,
  },
} satisfies Record<DifficultySubRating, DifficultyRatingBadgeColors>;
