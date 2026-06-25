import { ConstantText } from "@/components/text/ConstantText";
import { RopewikiRegionScreen } from "@/components/screens/regions/ropewiki/RopewikiRegionScreen";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useLocalSearchParams } from "expo-router";
import { PageDataSource } from "ropegeo-common/models";
import { View } from "react-native";

const VALID_SOURCES = new Set<string>(Object.values(PageDataSource));

function isPageDataSource(value: unknown): value is PageDataSource {
  return typeof value === "string" && VALID_SOURCES.has(value);
}

function firstString(
  v: string | string[] | undefined,
): string | undefined {
  if (v == null) return undefined;
  return typeof v === "string" ? v : v[0];
}

function parseSavedPageId(
  params: Record<string, string | string[] | undefined>,
): string | null {
  const pageId = firstString(params.savedPage);
  if (pageId == null || pageId === "") return null;
  return pageId;
}

export default function RegionRoute() {
  const { text } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const params = useLocalSearchParams<{
    id: string;
    source: string;
    savedPage?: string;
  }>();
  const regionId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : undefined;
  const source =
    typeof params.source === "string"
      ? params.source
      : Array.isArray(params.source)
        ? params.source[0]
        : undefined;

  if (regionId == null || regionId === "") {
    return (
      <View style={styles.error}>
        <ConstantText
          size={uiScale.toast.text.message}
          typography={textStyle.toast.message}
          style={[styles.errorText, { color: text.secondary }]}
        >
          Missing id.
        </ConstantText>
      </View>
    );
  }

  if (!isPageDataSource(source)) {
    return (
      <View style={styles.error}>
        <ConstantText
          size={uiScale.toast.text.message}
          typography={textStyle.toast.message}
          style={[styles.errorText, { color: text.secondary }]}
        >
          {source == null || source === ""
            ? "Missing source."
            : `Invalid source: ${source}`}
        </ConstantText>
      </View>
    );
  }

  const savedPageId = parseSavedPageId(params);

  switch (source) {
    case PageDataSource.Ropewiki:
      return (
        <View style={{ flex: 1 }}>
          <RopewikiRegionScreen
            regionId={regionId}
            source={source}
            savedPageId={savedPageId}
          />
        </View>
      );
  }

  return (
    <View style={styles.error}>
      <ConstantText
        size={uiScale.toast.text.message}
        typography={textStyle.toast.message}
        style={[styles.errorText, { color: text.secondary }]}
      >
        Unknown source: {source}
      </ConstantText>
    </View>
  );
}

const styles = {
  error: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 24,
  },
  errorText: {
    textAlign: "center" as const,
  },
};
