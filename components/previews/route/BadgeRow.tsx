import React from "react";
import { StyleSheet, View } from "react-native";
import { ExtremeRiskBadge } from "@/components/badges/difficulty/ExtremeRiskBadge";
import { VeryHighRiskBadge } from "@/components/badges/difficulty/VeryHighRiskBadge";
import { FlowingC1WaterBadge } from "@/components/badges/difficulty/FlowingC1WaterBadge";
import { FlowingC2WaterBadge } from "@/components/badges/difficulty/FlowingC2WaterBadge";
import { FlowingC3WaterBadge } from "@/components/badges/difficulty/FlowingC3WaterBadge";
import { FlowingC4WaterBadge } from "@/components/badges/difficulty/FlowingC4WaterBadge";
import { FlowingWaterBadge } from "@/components/badges/difficulty/FlowingWaterBadge";
import { FullDayBadge } from "@/components/badges/difficulty/FullDayBadge";
import { HalfDayBadge } from "@/components/badges/difficulty/HalfDayBadge";
import { HighRiskBadge } from "@/components/badges/difficulty/HighRiskBadge";
import { LongDayBadge } from "@/components/badges/difficulty/LongDayBadge";
import { MinimalWaterBadge } from "@/components/badges/difficulty/MinimalWaterBadge";
import { ModerateRiskBadge } from "@/components/badges/difficulty/ModerateRiskBadge";
import { MultipleDaysBadge } from "@/components/badges/difficulty/MultipleDaysBadge";
import { MinimalRiskBadge } from "@/components/badges/difficulty/MinimalRiskBadge";
import { NotTechnicalBadge } from "@/components/badges/difficulty/NotTechnicalBadge";
import { OvernightBadge } from "@/components/badges/difficulty/OvernightBadge";
import { ScramblingBadge } from "@/components/badges/difficulty/ScramblingBadge";
import { ShortBadge } from "@/components/badges/difficulty/ShortBadge";
import { SomeRiskBadge } from "@/components/badges/difficulty/SomeRiskBadge";
import { SwimmingWaterBadge } from "@/components/badges/difficulty/SwimmingWaterBadge";
import { TechnicalBadge } from "@/components/badges/difficulty/TechnicalBadge";
import { VeryTechnicalBadge } from "@/components/badges/difficulty/VeryTechnicalBadge";
import { ClosedBadge } from "@/components/badges/permit/ClosedBadge";
import { NoPermitBadge } from "@/components/badges/permit/NoPermitBadge";
import { PermitRequiredBadge } from "@/components/badges/permit/PermitRequiredBadge";
import { RestrictedBadge } from "@/components/badges/permit/RestrictedBadge";
import { CaveBadge } from "@/components/badges/routeType/CaveBadge";
import { PoiBadge } from "@/components/badges/routeType/PoiBadge";
import {
  AcaDifficultyRating,
  AcaRiskSubRating,
  AcaTechnicalSubRating,
  AcaTimeSubRating,
  AcaWaterSubRating,
  type DifficultyRating,
  PermitStatus,
  RouteType,
} from "ropegeo-common/models";
import {
  ROUTE_PREVIEW_BADGE_GAP,
  ROUTE_PREVIEW_MAX_BADGES,
} from "@/utils/layout/routePreviewLayout";

const MAX_BADGES = ROUTE_PREVIEW_MAX_BADGES;

const TECHNICAL_BADGES: Record<AcaTechnicalSubRating, React.ComponentType> = {
  [AcaTechnicalSubRating.One]: NotTechnicalBadge,
  [AcaTechnicalSubRating.Two]: ScramblingBadge,
  [AcaTechnicalSubRating.Three]: TechnicalBadge,
  [AcaTechnicalSubRating.Four]: VeryTechnicalBadge,
};
const WATER_BADGES: Record<AcaWaterSubRating, React.ComponentType> = {
  [AcaWaterSubRating.A]: MinimalWaterBadge,
  [AcaWaterSubRating.B]: SwimmingWaterBadge,
  [AcaWaterSubRating.C]: FlowingWaterBadge,
  [AcaWaterSubRating.C1]: FlowingC1WaterBadge,
  [AcaWaterSubRating.C2]: FlowingC2WaterBadge,
  [AcaWaterSubRating.C3]: FlowingC3WaterBadge,
  [AcaWaterSubRating.C4]: FlowingC4WaterBadge,
};
const TIME_BADGES: Record<AcaTimeSubRating, React.ComponentType> = {
  [AcaTimeSubRating.I]: ShortBadge,
  [AcaTimeSubRating.II]: HalfDayBadge,
  [AcaTimeSubRating.III]: FullDayBadge,
  [AcaTimeSubRating.IV]: LongDayBadge,
  [AcaTimeSubRating.V]: OvernightBadge,
  [AcaTimeSubRating.VI]: MultipleDaysBadge,
};
const RISK_BADGES: Record<AcaRiskSubRating, React.ComponentType> = {
  [AcaRiskSubRating.G]: MinimalRiskBadge,
  [AcaRiskSubRating.PG]: SomeRiskBadge,
  [AcaRiskSubRating.PG13]: ModerateRiskBadge,
  [AcaRiskSubRating.R]: HighRiskBadge,
  [AcaRiskSubRating.X]: VeryHighRiskBadge,
  [AcaRiskSubRating.XX]: ExtremeRiskBadge,
};
const PERMIT_BADGES: Record<
  PermitStatus,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  [PermitStatus.No]: NoPermitBadge,
  [PermitStatus.Yes]: PermitRequiredBadge,
  [PermitStatus.Restricted]: RestrictedBadge,
  [PermitStatus.Closed]: ClosedBadge,
};

export type BadgeRowProps = {
  difficultyRating: DifficultyRating;
  permit?: PermitStatus | null;
  routeType?: RouteType | null;
  badgeGap?: number;
  maxVisibleBadges?: number;
};

export function BadgeRow({
  difficultyRating,
  permit = null,
  routeType = null,
  badgeGap = ROUTE_PREVIEW_BADGE_GAP,
  maxVisibleBadges = MAX_BADGES,
}: BadgeRowProps) {
  const badges: React.ReactNode[] = [];
  if (routeType === RouteType.Cave) {
    badges.push(React.createElement(CaveBadge, { key: "routeType" }));
  } else if (routeType === RouteType.POI) {
    badges.push(React.createElement(PoiBadge, { key: "routeType" }));
  }
  if (difficultyRating instanceof AcaDifficultyRating) {
    if (difficultyRating.technical != null) {
      const C = TECHNICAL_BADGES[difficultyRating.technical];
      if (C) badges.push(React.createElement(C, { key: "technical" }));
    }
    if (difficultyRating.water != null) {
      const C = WATER_BADGES[difficultyRating.water];
      if (C) badges.push(React.createElement(C, { key: "water" }));
    }
    if (difficultyRating.time != null) {
      const C = TIME_BADGES[difficultyRating.time];
      if (C) badges.push(React.createElement(C, { key: "time" }));
    }
    const risk = difficultyRating.getEffectiveRiskForDisplay();
    if (risk != null) {
      const C = RISK_BADGES[risk];
      if (C) badges.push(React.createElement(C, { key: "risk" }));
    }
  }
  if (permit != null && PERMIT_BADGES[permit] != null) {
    badges.push(React.createElement(PERMIT_BADGES[permit], { key: "permit" }));
  }
  const displayBadges = badges.slice(
    0,
    Math.min(MAX_BADGES, Math.max(0, maxVisibleBadges)),
  );
  if (displayBadges.length === 0) return null;
  return (
    <View style={[styles.badgeRow, { gap: badgeGap }]}>
      {displayBadges}
    </View>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    flexWrap: "nowrap",
  },
});
