import { StyleSheet } from "react-native";

import { ScalingText } from "@/components/ScalingText";
import {
  ROUTE_PREVIEW_LOCATION_MAX_LINES,
  useRoutePreviewMetrics,
} from "@/utils/routePreviewLayout";

export function RoutePreviewTitle({
  title,
  color,
}: {
  title: string;
  color: string;
}) {
  const metrics = useRoutePreviewMetrics();

  return (
    <ScalingText
      maxFontSize={metrics.titleMaxFontSize}
      minFontSize={metrics.titleMinFontSize}
      numberOfLines={1}
      ellipsizeMode="clip"
      measureKey={metrics.fontScale}
      measure={{
        type: "width",
        widthSafetyMargin: metrics.titleWidthSafetyMargin,
      }}
      measureTextStyle={styles.titleMeasure}
      style={[
        styles.title,
        {
          color,
          paddingBottom: metrics.titleDescenderPadding,
        },
      ]}
    >
      {title}
    </ScalingText>
  );
}

export function RoutePreviewLocation({
  location,
  color,
}: {
  location: string;
  color: string;
}) {
  const metrics = useRoutePreviewMetrics();

  return (
    <ScalingText
      maxFontSize={metrics.locationMaxFontSize}
      minFontSize={metrics.locationMinFontSize}
      numberOfLines={ROUTE_PREVIEW_LOCATION_MAX_LINES}
      ellipsizeMode="tail"
      hideWhenEmpty
      measureKey={metrics.fontScale}
      containerStyle={{ marginTop: metrics.locationMarginTopAfterTitle }}
      measure={{
        type: "lineCount",
        maxLinesAtMaxSize: ROUTE_PREVIEW_LOCATION_MAX_LINES,
        widthSafetyMargin: metrics.locationWidthSafetyMargin,
      }}
      style={[styles.location, { color }]}
    >
      {location}
    </ScalingText>
  );
}

const styles = StyleSheet.create({
  titleMeasure: {
    fontWeight: "600",
  },
  title: {
    fontWeight: "600",
  },
  location: {
    alignSelf: "stretch",
  },
});
