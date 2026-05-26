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

const DEFAULT_RATING_ICON = "#ffffff";
const RED_RATING_ICON = "#ef4444";

const greenBackground = "#166534";
const yellowBackground = "#ca8a04";
const orangeBackground = "#b45309";
const redBackground = "#b91c1c";
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
    icon: RED_RATING_ICON,
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
    icon: RED_RATING_ICON,
  },
  [AcaRiskSubRating.XX]: {
    background: blackBackground,
    icon: RED_RATING_ICON,
  },
} satisfies Record<DifficultySubRating, DifficultyRatingBadgeColors>;
