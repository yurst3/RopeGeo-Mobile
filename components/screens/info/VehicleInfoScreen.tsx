/** Descriptions from RopeWiki Property:Has_vehicle_type (https://ropewiki.com/Property:Has_vehicle_type). */
import { FourWDHighClearanceBadge } from "@/components/badges/vehicle/4WDHighClearanceBadge";
import { FourWDBadge } from "@/components/badges/vehicle/4WDBadge";
import { FourWDVeryHighClearanceBadge } from "@/components/badges/vehicle/4WDVeryHighClearanceBadge";
import { HighClearanceBadge } from "@/components/badges/vehicle/HighClearanceBadge";
import { PassengerBadge } from "@/components/badges/vehicle/PassengerBadge";
import { InfoScreenLayout } from "@/components/screens/info/InfoScreenLayout";
import {
  InfoScreenBody,
  InfoScreenSubtitle,
} from "@/components/screens/info/InfoScreenText";
import { useInfoScreenStyles } from "@/utils/info/infoScreenTheme";
import { RopewikiVehicleType } from "ropegeo-common/models";
import React from "react";
import { View } from "react-native";

const VEHICLE_ORDER: RopewikiVehicleType[] = [
  RopewikiVehicleType.passenger,
  RopewikiVehicleType.fourWd,
  RopewikiVehicleType.highClearance,
  RopewikiVehicleType.fourWdHighClearance,
  RopewikiVehicleType.fourWdVeryHighClearance,
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

const VEHICLE_DESCRIPTIONS: Record<RopewikiVehicleType, { body: string }> = {
  [RopewikiVehicleType.passenger]: {
    body: "Any vehicle you want. Standard passenger cars are suitable for accessing the start or exit.",
  },
  [RopewikiVehicleType.highClearance]: {
    body: "A vehicle with at least 8 inches of clearance. Required for rougher or higher-clearance roads.",
  },
  [RopewikiVehicleType.fourWd]: {
    body: "A vehicle with 4x4 traction. Required for roads where four-wheel drive is needed.",
  },
  [RopewikiVehicleType.fourWdHighClearance]: {
    body: "A vehicle with 4x4 traction and at least 8 inches of clearance. Required for more demanding access roads.",
  },
  [RopewikiVehicleType.fourWdVeryHighClearance]: {
    body: "A 4WD pickup, Hummer, or similar vehicle with very high clearance. Required for the most difficult access roads.",
  },
};

export type VehicleInfoScreenProps = {
  highlightedVehicle?: RopewikiVehicleType | string | null;
};

export function VehicleInfoScreen({
  highlightedVehicle,
}: VehicleInfoScreenProps) {
  const styles = useInfoScreenStyles();

  return (
    <InfoScreenLayout title="Vehicle type">
      <InfoScreenSubtitle style={styles.subtitle}>
        Vehicle type indicates the kind of vehicle required to access the start
        or exit of the canyon. Definitions follow RopeWiki and NPS guidelines.
      </InfoScreenSubtitle>
      {VEHICLE_ORDER.map((vehicleType) => {
        const BadgeComponent = VEHICLE_BADGES[vehicleType];
        const { body } = VEHICLE_DESCRIPTIONS[vehicleType];
        const isHighlighted =
          highlightedVehicle != null && highlightedVehicle === vehicleType;

        return (
          <View
            key={vehicleType}
            style={[styles.row, isHighlighted && styles.rowHighlighted]}
          >
            <View style={styles.badgeWrap}>
              <BadgeComponent showLabel />
            </View>
            <View style={styles.descriptionWrap}>
              <InfoScreenBody>{body}</InfoScreenBody>
            </View>
          </View>
        );
      })}
    </InfoScreenLayout>
  );
}
