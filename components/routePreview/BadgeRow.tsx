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
  AcaDifficulty,
  AcaRiskRating,
  AcaTechnicalRating,
  AcaTimeRating,
  AcaWaterRating,
  type Difficulty,
  PermitStatus,
  RouteType,
} from "ropegeo-common/models";

const TECHNICAL_BADGES: Record<AcaTechnicalRating, React.ComponentType> = {
  [AcaTechnicalRating.One]: NotTechnicalBadge,
  [AcaTechnicalRating.Two]: ScramblingBadge,
  [AcaTechnicalRating.Three]: TechnicalBadge,
  [AcaTechnicalRating.Four]: VeryTechnicalBadge,
};
const WATER_BADGES: Record<AcaWaterRating, React.ComponentType> = {
  [AcaWaterRating.A]: MinimalWaterBadge,
  [AcaWaterRating.B]: SwimmingWaterBadge,
  [AcaWaterRating.C]: FlowingWaterBadge,
  [AcaWaterRating.C1]: FlowingC1WaterBadge,
  [AcaWaterRating.C2]: FlowingC2WaterBadge,
  [AcaWaterRating.C3]: FlowingC3WaterBadge,
  [AcaWaterRating.C4]: FlowingC4WaterBadge,
};
const TIME_BADGES: Record<AcaTimeRating, React.ComponentType> = {
  [AcaTimeRating.I]: ShortBadge,
  [AcaTimeRating.II]: HalfDayBadge,
  [AcaTimeRating.III]: FullDayBadge,
  [AcaTimeRating.IV]: LongDayBadge,
  [AcaTimeRating.V]: OvernightBadge,
  [AcaTimeRating.VI]: MultipleDaysBadge,
};
const RISK_BADGES: Record<AcaRiskRating, React.ComponentType> = {
  [AcaRiskRating.G]: MinimalRiskBadge,
  [AcaRiskRating.PG]: SomeRiskBadge,
  [AcaRiskRating.PG13]: ModerateRiskBadge,
  [AcaRiskRating.R]: HighRiskBadge,
  [AcaRiskRating.X]: VeryHighRiskBadge,
  [AcaRiskRating.XX]: ExtremeRiskBadge,
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

const MAX_BADGES = 5;

export type BadgeRowProps = {
  difficulty: Difficulty;
  permit?: PermitStatus | null;
  routeType?: RouteType | null;
  scale?: number;
};

export function BadgeRow({
  difficulty,
  permit = null,
  routeType = null,
  scale = 1,
}: BadgeRowProps) {
  const badges: React.ReactNode[] = [];
  if (routeType === RouteType.Cave) {
    badges.push(React.createElement(CaveBadge, { key: "routeType" }));
  } else if (routeType === RouteType.POI) {
    badges.push(React.createElement(PoiBadge, { key: "routeType" }));
  }
  if (difficulty instanceof AcaDifficulty) {
    if (difficulty.technical != null) {
      const C = TECHNICAL_BADGES[difficulty.technical];
      if (C) badges.push(React.createElement(C, { key: "technical" }));
    }
    if (difficulty.water != null) {
      const C = WATER_BADGES[difficulty.water];
      if (C) badges.push(React.createElement(C, { key: "water" }));
    }
    if (difficulty.time != null) {
      const C = TIME_BADGES[difficulty.time];
      if (C) badges.push(React.createElement(C, { key: "time" }));
    }
    const risk = difficulty.getEffectiveRiskForDisplay();
    if (risk != null) {
      const C = RISK_BADGES[risk];
      if (C) badges.push(React.createElement(C, { key: "risk" }));
    }
  }
  if (permit != null && PERMIT_BADGES[permit] != null) {
    badges.push(React.createElement(PERMIT_BADGES[permit], { key: "permit" }));
  }
  const displayBadges = badges.slice(0, MAX_BADGES);
  if (displayBadges.length === 0) return null;
  return (
    <View
      style={[
        styles.badgeRow,
        { transform: [{ scale }], transformOrigin: "left center" },
      ]}
    >
      {displayBadges}
    </View>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
  },
});
