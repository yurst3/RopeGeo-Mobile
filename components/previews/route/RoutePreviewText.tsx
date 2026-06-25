import { StyleSheet } from "react-native";

import { ScalingText } from "@/components/text/ScalingText";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useFabulousTitle } from "@/utils/theme/useFabulousTitle";
import {
  formatPreviewAkaLine,
} from "@/utils/layout/previewLayout";
import {
  ROUTE_PREVIEW_AKA_MAX_LINES,
  ROUTE_PREVIEW_LOCATION_MAX_LINES,
  ROUTE_PREVIEW_TITLE_WIDTH_SAFETY_MARGIN,
  useRoutePreviewMetrics,
} from "@/utils/layout/routePreviewLayout";

export function RoutePreviewTitle({
  title,
  color,
}: {
  title: string;
  color: string;
}) {
  const metrics = useRoutePreviewMetrics();
  const uiScale = useUiScale();
  const style = useTextStyle();
  const displayTitle = useFabulousTitle(title);

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
      {displayTitle}
    </ScalingText>
  );
}

export function RoutePreviewAka({
  aka,
  color,
}: {
  aka: string[];
  color: string;
}) {
  const metrics = useRoutePreviewMetrics();
  const uiScale = useUiScale();
  const style = useTextStyle();
  const line = formatPreviewAkaLine(aka);

  return (
    <ScalingText
      size={uiScale.preview.text.locationHierarchy}
      typography={style.preview.locationHierarchy}
      numberOfLines={ROUTE_PREVIEW_AKA_MAX_LINES}
      ellipsizeMode="tail"
      hideWhenEmpty
      measure={{
        type: "lineCount",
        maxLinesAtMaxSize: ROUTE_PREVIEW_AKA_MAX_LINES,
        widthSafetyMargin: metrics.locationWidthSafetyMargin,
      }}
      style={[styles.aka, { color }]}
    >
      {line}
    </ScalingText>
  );
}

export function RoutePreviewLocation({
  location,
  color,
  compactBelowTitle = true,
}: {
  location: string;
  color: string;
  /** When false, omits the tight title overlap (e.g. when an AKA line sits above). */
  compactBelowTitle?: boolean;
}) {
  const metrics = useRoutePreviewMetrics();
  const uiScale = useUiScale();
  const style = useTextStyle();

  return (
    <ScalingText
      size={uiScale.preview.text.locationHierarchy}
      typography={style.preview.locationHierarchy}
      numberOfLines={ROUTE_PREVIEW_LOCATION_MAX_LINES}
      ellipsizeMode="tail"
      hideWhenEmpty
      containerStyle={
        compactBelowTitle
          ? { marginTop: metrics.locationMarginTopAfterTitle }
          : undefined
      }
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
  title: {},
  aka: {
    alignSelf: "stretch",
  },
  location: {
    alignSelf: "stretch",
  },
});
