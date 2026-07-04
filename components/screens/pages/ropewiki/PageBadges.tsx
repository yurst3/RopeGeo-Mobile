import { UnknownBadge } from "@/components/badges/UnknownBadge";
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
import { ClosedBadge } from "@/components/badges/permit/ClosedBadge";
import { NoPermitBadge } from "@/components/badges/permit/NoPermitBadge";
import { PermitRequiredBadge } from "@/components/badges/permit/PermitRequiredBadge";
import { RestrictedBadge } from "@/components/badges/permit/RestrictedBadge";
import { CanyonBadge } from "@/components/badges/routeType/CanyonBadge";
import { CaveBadge } from "@/components/badges/routeType/CaveBadge";
import { PoiBadge } from "@/components/badges/routeType/PoiBadge";
import { NoShuttleBadge } from "@/components/badges/shuttle/NoShuttleBadge";
import { ShuttleRequiredBadge } from "@/components/badges/shuttle/ShuttleRequiredBadge";
import { FourWDHighClearanceBadge } from "@/components/badges/vehicle/4WDHighClearanceBadge";
import { FourWDBadge } from "@/components/badges/vehicle/4WDBadge";
import { FourWDVeryHighClearanceBadge } from "@/components/badges/vehicle/4WDVeryHighClearanceBadge";
import { HighClearanceBadge } from "@/components/badges/vehicle/HighClearanceBadge";
import { PassengerBadge } from "@/components/badges/vehicle/PassengerBadge";
import { BadgeButton } from "@/components/buttons/nonstandard/BadgeButton";
import { BadgeLayoutProvider } from "@/components/badges/Badge";
import {
  PAGE_BADGE_CARD_PADDING,
  PAGE_BADGE_CELL_PADDING,
  PAGE_BADGE_ROW_GAP,
  usePageBadgeMetrics,
} from "@/utils/layout/pageBadgeLayout";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import {
  AcaDifficultyRating,
  AcaRiskSubRating,
  AcaTechnicalSubRating,
  AcaTimeSubRating,
  AcaWaterSubRating,
  PermitStatus,
  RopewikiVehicleType,
  type OfflineRopewikiPageView,
  type OnlineRopewikiPageView,
} from "ropegeo-common/models";

const TECHNICAL_BADGES: Record<
  AcaTechnicalSubRating,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  [AcaTechnicalSubRating.One]: NotTechnicalBadge,
  [AcaTechnicalSubRating.Two]: ScramblingBadge,
  [AcaTechnicalSubRating.Three]: TechnicalBadge,
  [AcaTechnicalSubRating.Four]: VeryTechnicalBadge,
};
const WATER_BADGES: Record<
  AcaWaterSubRating,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  [AcaWaterSubRating.A]: MinimalWaterBadge,
  [AcaWaterSubRating.B]: SwimmingWaterBadge,
  [AcaWaterSubRating.C]: FlowingWaterBadge,
  [AcaWaterSubRating.C1]: FlowingC1WaterBadge,
  [AcaWaterSubRating.C2]: FlowingC2WaterBadge,
  [AcaWaterSubRating.C3]: FlowingC3WaterBadge,
  [AcaWaterSubRating.C4]: FlowingC4WaterBadge,
};
const TIME_BADGES: Record<
  AcaTimeSubRating,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  [AcaTimeSubRating.I]: ShortBadge,
  [AcaTimeSubRating.II]: HalfDayBadge,
  [AcaTimeSubRating.III]: FullDayBadge,
  [AcaTimeSubRating.IV]: LongDayBadge,
  [AcaTimeSubRating.V]: OvernightBadge,
  [AcaTimeSubRating.VI]: MultipleDaysBadge,
};
const RISK_BADGES: Record<
  AcaRiskSubRating,
  React.ComponentType<{ showLabel?: boolean }>
> = {
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

type BadgeTypeKey =
  | "technical"
  | "water"
  | "time"
  | "risk"
  | "permit"
  | "shuttle"
  | "vehicle"
  | "routeType";

const BADGE_TYPE_LABELS: Record<BadgeTypeKey, string> = {
  technical: "Technical Rating",
  water: "Water Rating",
  time: "Time Estimate",
  risk: "Effective Risk",
  permit: "Permit",
  shuttle: "Shuttle",
  vehicle: "Vehicle",
  routeType: "Route Type",
};

/** Types that have an info screen; show info button and open on badge press. */
const INFO_BADGE_TYPES: BadgeTypeKey[] = [
  "technical",
  "water",
  "time",
  "risk",
  "permit",
  "shuttle",
  "vehicle",
];

const VEHICLE_BADGES: Record<
  RopewikiVehicleType,
  React.ComponentType<{ showLabel?: boolean }>
> = {
  [RopewikiVehicleType.passenger]: PassengerBadge,
  [RopewikiVehicleType.highClearance]: HighClearanceBadge,
  [RopewikiVehicleType.fourWd]: FourWDBadge,
  [RopewikiVehicleType.fourWdHighClearance]: FourWDHighClearanceBadge,
  [RopewikiVehicleType.fourWdVeryHighClearance]: FourWDVeryHighClearanceBadge,
};

export type PageBadgesProps = {
  data: OnlineRopewikiPageView | OfflineRopewikiPageView;
  /** Route type for badge display (e.g. "Canyon", "Cave", "POI"). */
  routeType?: string | null;
};

const ROUTE_TYPE_VALUES = ["Canyon", "Cave", "POI"] as const;

const ROUTE_TYPE_BADGES: Record<
  (typeof ROUTE_TYPE_VALUES)[number],
  React.ComponentType<{ showLabel?: boolean }>
> = {
  Canyon: CanyonBadge,
  Cave: CaveBadge,
  POI: PoiBadge,
};

/** Tab stack for badge info screens — must match the tab the user opened the page from. */
function badgeInfoBasePath(pathname: string): "/explore" | "/saved" {
  return pathname === "/saved" || pathname.startsWith("/saved/")
    ? "/saved"
    : "/explore";
}

function openInfo(
  router: ReturnType<typeof useRouter>,
  type: BadgeTypeKey,
  value: string | number | null | undefined,
  basePath: "/explore" | "/saved"
) {
  const param = value != null ? String(value) : undefined;
  switch (type) {
    case "technical":
      router.push({
        pathname: `${basePath}/technical-info`,
        params: param ? { highlightedTechnical: param } : {},
      });
      break;
    case "water":
      router.push({
        pathname: `${basePath}/water-info`,
        params: param ? { highlightedWater: param } : {},
      });
      break;
    case "time":
      router.push({
        pathname: `${basePath}/time-info`,
        params: param ? { highlightedTime: param } : {},
      });
      break;
    case "risk":
      router.push({
        pathname: `${basePath}/risk-info`,
        params: param ? { highlightedRisk: param } : {},
      });
      break;
    case "permit":
      router.push({
        pathname: `${basePath}/permit-info`,
        params: param ? { highlightedPermit: param } : {},
      });
      break;
    case "shuttle":
      router.push({
        pathname: `${basePath}/shuttle-info`,
        params: param != null ? { highlightedShuttle: param } : {},
      });
      break;
    case "vehicle":
      router.push({
        pathname: `${basePath}/vehicle-info`,
        params: param != null ? { highlightedVehicle: param } : {},
      });
      break;
    case "routeType":
      break;
    default:
      break;
  }
}

export function PageBadges({ data, routeType }: PageBadgesProps) {
  const metrics = usePageBadgeMetrics();
  const router = useRouter();
  const pathname = usePathname();
  const infoBasePath = badgeInfoBasePath(pathname ?? "");
  const aca =
    data.difficultyRating instanceof AcaDifficultyRating ? data.difficultyRating : null;
  const permit = data.permit ?? null;
  const technical = aca?.technical ?? null;
  const water = aca?.water ?? null;
  const time = aca?.time ?? null;
  const risk = aca?.effectiveRisk ?? null;

  const showInfoButton = (type: BadgeTypeKey) =>
    INFO_BADGE_TYPES.includes(type);

  const renderBadge = (
    type: BadgeTypeKey
  ): { node: React.ReactNode; value: string | number | null } => {
    switch (type) {
      case "technical": {
        if (technical == null) {
          return { node: <UnknownBadge showLabel />, value: null };
        }
        const TC = TECHNICAL_BADGES[technical];
        return {
          node: TC ? <TC showLabel /> : <UnknownBadge showLabel />,
          value: technical,
        };
      }
      case "water": {
        if (water == null) {
          return { node: <UnknownBadge showLabel />, value: null };
        }
        const WC = WATER_BADGES[water];
        return {
          node: WC ? <WC showLabel /> : <UnknownBadge showLabel />,
          value: water,
        };
      }
      case "time": {
        if (time == null) {
          return { node: <UnknownBadge showLabel />, value: null };
        }
        const TimeC = TIME_BADGES[time];
        return {
          node: TimeC ? <TimeC showLabel /> : <UnknownBadge showLabel />,
          value: time,
        };
      }
      case "risk": {
        if (risk == null) {
          return { node: <UnknownBadge showLabel />, value: null };
        }
        const RC = RISK_BADGES[risk];
        return {
          node: RC ? <RC showLabel /> : <UnknownBadge showLabel />,
          value: risk,
        };
      }
      case "permit": {
        if (permit == null) {
          return { node: <UnknownBadge showLabel />, value: null };
        }
        const PC = PERMIT_BADGES[permit];
        return {
          node: PC ? <PC showLabel /> : <UnknownBadge showLabel />,
          value: permit,
        };
      }
      case "shuttle": {
        const shuttleVal = data.shuttleTime ?? null;
        if (shuttleVal == null) {
          return { node: <UnknownBadge showLabel />, value: null };
        }
        if (shuttleVal.value === 0) {
          return { node: <NoShuttleBadge showLabel />, value: 0 };
        }
        return {
          node: <ShuttleRequiredBadge showLabel />,
          value: shuttleVal.value,
        };
      }
      case "vehicle": {
        const vehicleVal = data.vehicle ?? null;
        if (vehicleVal == null) {
          return { node: <UnknownBadge showLabel />, value: null };
        }
        const VC = VEHICLE_BADGES[vehicleVal];
        return {
          node: <VC showLabel />,
          value: vehicleVal,
        };
      }
      case "routeType": {
        const routeTypeVal = routeType ?? null;
        if (routeTypeVal == null) {
          return { node: <UnknownBadge showLabel />, value: null };
        }
        const RC =
          ROUTE_TYPE_VALUES.includes(routeTypeVal as (typeof ROUTE_TYPE_VALUES)[number])
            ? ROUTE_TYPE_BADGES[routeTypeVal as (typeof ROUTE_TYPE_VALUES)[number]]
            : null;
        return {
          node: RC ? <RC showLabel /> : <UnknownBadge showLabel />,
          value: routeTypeVal,
        };
      }
      default:
        return { node: <UnknownBadge showLabel />, value: null };
    }
  };

  const BadgeItem = ({ type }: { type: BadgeTypeKey }) => {
    const label = BADGE_TYPE_LABELS[type];
    const { node, value } = renderBadge(type);
    const hasInfo = showInfoButton(type);

    return (
      <BadgeButton
        badge={node}
        badgeTypeLabel={label}
        onPress={
          hasInfo
            ? () => openInfo(router, type, value, infoBasePath)
            : undefined
        }
        accessibilityLabel={hasInfo ? `${label} info` : undefined}
      />
    );
  };

  return (
    <BadgeLayoutProvider
      size={metrics.badgeSize}
      labelFontSize={metrics.badgeLabelFontSize}
      labelMaxWidth={metrics.badgeSlotWidth}
    >
      <View
        style={[
          styles.container,
          {
            width: metrics.screenWidth,
            minHeight: metrics.gridMinHeight,
          },
        ]}
      >
        <View style={[styles.row, { minHeight: metrics.rowMinHeight }]}>
          <View style={styles.cell}>
            <BadgeItem type="technical" />
          </View>
          <View style={styles.cell}>
            <BadgeItem type="risk" />
          </View>
        </View>
        <View style={[styles.row, { minHeight: metrics.rowMinHeight }]}>
          <View style={styles.cell}>
            <BadgeItem type="water" />
          </View>
          <View style={styles.cell}>
            <BadgeItem type="permit" />
          </View>
        </View>
        <View style={[styles.row, { minHeight: metrics.rowMinHeight }]}>
          <View style={styles.cell}>
            <BadgeItem type="time" />
          </View>
          <View style={styles.cell}>
            <BadgeItem type="shuttle" />
          </View>
        </View>
        <View style={[styles.row, { minHeight: metrics.rowMinHeight }]}>
          <View style={styles.cell}>
            <BadgeItem type="routeType" />
          </View>
          <View style={styles.cell}>
            <BadgeItem type="vehicle" />
          </View>
        </View>
      </View>
    </BadgeLayoutProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    gap: PAGE_BADGE_ROW_GAP,
    marginTop: 16,
    marginLeft: -PAGE_BADGE_CARD_PADDING,
    marginRight: -PAGE_BADGE_CARD_PADDING,
  },
  row: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  cell: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: PAGE_BADGE_CELL_PADDING,
    alignItems: "stretch",
    overflow: "hidden",
  },
});
