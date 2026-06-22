import { StyleSheet } from "react-native";

import { ScalingText } from "@/components/text/ScalingText";
import { useText } from "@/context/TextContext";
import {
  ROUTE_PREVIEW_LOCATION_MAX_LINES,
  ROUTE_PREVIEW_LOCATION_WIDTH_SAFETY_MARGIN,
  ROUTE_PREVIEW_TITLE_WIDTH_SAFETY_MARGIN,
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
  const { uiScale, style } = useText();

  return (
    <ScalingText
      size={uiScale.preview.text.title}
      typography={style.preview.title}
      numberOfLines={1}
      ellipsizeMode="clip"
      measure={{
        type: "width",
        widthSafetyMargin: metrics.titleWidthSafetyMargin,
      }}
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
  const { uiScale, style } = useText();

  return (
    <ScalingText
      size={uiScale.preview.text.locationHierarchy}
      typography={style.preview.locationHierarchy}
      numberOfLines={ROUTE_PREVIEW_LOCATION_MAX_LINES}
      ellipsizeMode="tail"
      hideWhenEmpty
      containerStyle={{ marginTop: metrics.locationMarginTopAfterTitle }}
      measure={{
        type: "lineCount",
        maxLinesAtMaxSize: ROUTE_PREVIEW_LOCATION_MAX_LINES,
        widthSafetyMargin: ROUTE_PREVIEW_LOCATION_WIDTH_SAFETY_MARGIN,
      }}
      style={[styles.location, { color }]}
    >
      {location}
    </ScalingText>
  );
}

const styles = StyleSheet.create({
  title: {},
  location: {
    alignSelf: "stretch",
  },
});
