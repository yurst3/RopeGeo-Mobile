import type { ComponentType } from "react";
import { ExtremeRiskBadge } from "@/components/badges/difficulty/ExtremeRiskBadge";
import { FlowingC1WaterBadge } from "@/components/badges/difficulty/FlowingC1WaterBadge";
import { FlowingC2WaterBadge } from "@/components/badges/difficulty/FlowingC2WaterBadge";
import { FlowingC3WaterBadge } from "@/components/badges/difficulty/FlowingC3WaterBadge";
import { FlowingC4WaterBadge } from "@/components/badges/difficulty/FlowingC4WaterBadge";
import { FlowingWaterBadge } from "@/components/badges/difficulty/FlowingWaterBadge";
import { FullDayBadge } from "@/components/badges/difficulty/FullDayBadge";
import { HalfDayBadge } from "@/components/badges/difficulty/HalfDayBadge";
import { HighRiskBadge } from "@/components/badges/difficulty/HighRiskBadge";
import { LongDayBadge } from "@/components/badges/difficulty/LongDayBadge";
import { MinimalRiskBadge } from "@/components/badges/difficulty/MinimalRiskBadge";
import { MinimalWaterBadge } from "@/components/badges/difficulty/MinimalWaterBadge";
import { ModerateRiskBadge } from "@/components/badges/difficulty/ModerateRiskBadge";
import { MultipleDaysBadge } from "@/components/badges/difficulty/MultipleDaysBadge";
import { NotTechnicalBadge } from "@/components/badges/difficulty/NotTechnicalBadge";
import { OvernightBadge } from "@/components/badges/difficulty/OvernightBadge";
import { ScramblingBadge } from "@/components/badges/difficulty/ScramblingBadge";
import { ShortBadge } from "@/components/badges/difficulty/ShortBadge";
import { SomeRiskBadge } from "@/components/badges/difficulty/SomeRiskBadge";
import { SwimmingWaterBadge } from "@/components/badges/difficulty/SwimmingWaterBadge";
import { TechnicalBadge } from "@/components/badges/difficulty/TechnicalBadge";
import { VeryHighRiskBadge } from "@/components/badges/difficulty/VeryHighRiskBadge";
import { VeryTechnicalBadge } from "@/components/badges/difficulty/VeryTechnicalBadge";
import {
  AcaRiskRating,
  AcaTechnicalRating,
  AcaTimeRating,
  AcaWaterRating,
} from "ropegeo-common/models";

export type BadgeThumbProps = { showLabel?: boolean };

export const ACA_TECHNICAL_BADGES: Record<
  AcaTechnicalRating,
  ComponentType<BadgeThumbProps>
> = {
  [AcaTechnicalRating.One]: NotTechnicalBadge,
  [AcaTechnicalRating.Two]: ScramblingBadge,
  [AcaTechnicalRating.Three]: TechnicalBadge,
  [AcaTechnicalRating.Four]: VeryTechnicalBadge,
};

/** Matches {@link NotTechnicalBadge} / badge `showLabel` copy for filter slider titles. */
export const ACA_TECHNICAL_THUMB_TITLES: Record<AcaTechnicalRating, string> = {
  [AcaTechnicalRating.One]: "Not Technical",
  [AcaTechnicalRating.Two]: "Scrambling",
  [AcaTechnicalRating.Three]: "Technical",
  [AcaTechnicalRating.Four]: "Very Technical",
};

export const ACA_WATER_BADGES: Record<
  AcaWaterRating,
  ComponentType<BadgeThumbProps>
> = {
  [AcaWaterRating.A]: MinimalWaterBadge,
  [AcaWaterRating.B]: SwimmingWaterBadge,
  [AcaWaterRating.C]: FlowingWaterBadge,
  [AcaWaterRating.C1]: FlowingC1WaterBadge,
  [AcaWaterRating.C2]: FlowingC2WaterBadge,
  [AcaWaterRating.C3]: FlowingC3WaterBadge,
  [AcaWaterRating.C4]: FlowingC4WaterBadge,
};

export const ACA_WATER_THUMB_TITLES: Record<AcaWaterRating, string> = {
  [AcaWaterRating.A]: "Minimal Water",
  [AcaWaterRating.B]: "Swimming Water",
  [AcaWaterRating.C]: "Flowing Water",
  [AcaWaterRating.C1]: "Moderate Current",
  [AcaWaterRating.C2]: "High Current",
  [AcaWaterRating.C3]: "Very High Current",
  [AcaWaterRating.C4]: "Extreme Current",
};

export const ACA_TIME_BADGES: Record<
  AcaTimeRating,
  ComponentType<BadgeThumbProps>
> = {
  [AcaTimeRating.I]: ShortBadge,
  [AcaTimeRating.II]: HalfDayBadge,
  [AcaTimeRating.III]: FullDayBadge,
  [AcaTimeRating.IV]: LongDayBadge,
  [AcaTimeRating.V]: OvernightBadge,
  [AcaTimeRating.VI]: MultipleDaysBadge,
};

export const ACA_TIME_THUMB_TITLES: Record<AcaTimeRating, string> = {
  [AcaTimeRating.I]: "Short",
  [AcaTimeRating.II]: "Half Day",
  [AcaTimeRating.III]: "Full Day",
  [AcaTimeRating.IV]: "Long Day",
  [AcaTimeRating.V]: "Overnight",
  [AcaTimeRating.VI]: "Multiple Days",
};

export const ACA_RISK_BADGES: Record<
  AcaRiskRating,
  ComponentType<BadgeThumbProps>
> = {
  [AcaRiskRating.G]: MinimalRiskBadge,
  [AcaRiskRating.PG]: SomeRiskBadge,
  [AcaRiskRating.PG13]: ModerateRiskBadge,
  [AcaRiskRating.R]: HighRiskBadge,
  [AcaRiskRating.X]: VeryHighRiskBadge,
  [AcaRiskRating.XX]: ExtremeRiskBadge,
};

export const ACA_RISK_THUMB_TITLES: Record<AcaRiskRating, string> = {
  [AcaRiskRating.G]: "Minimal Risk",
  [AcaRiskRating.PG]: "Some Risk",
  [AcaRiskRating.PG13]: "Moderate Risk",
  [AcaRiskRating.R]: "High Risk",
  [AcaRiskRating.X]: "Very High Risk",
  [AcaRiskRating.XX]: "Extreme Risk",
};
