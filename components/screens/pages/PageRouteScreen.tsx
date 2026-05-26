import { useColorTheme } from "@/context/ColorThemeContext";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { PageDataSource } from "ropegeo-common/models";

import { RopewikiPageScreen } from "./ropewiki/RopewikiPageScreen";

const VALID_SOURCES = new Set<string>(Object.values(PageDataSource));

function isPageDataSource(value: unknown): value is PageDataSource {
  return typeof value === "string" && VALID_SOURCES.has(value);
}

/**
 * Shared page route: validates `source` + `id`, then renders the source-specific screen.
 * Used by explore and saved stacks (`/(tabs)/explore/[id]/page`, `/(tabs)/saved/[id]/page`).
 */
export default function PageRouteScreen() {
  const { text } = useColorTheme();
  const params = useLocalSearchParams<{
    id: string;
    source: string;
  }>();
  const pageId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? (params.id[0] ?? "")
        : "";
  const source =
    typeof params.source === "string"
      ? params.source
      : Array.isArray(params.source)
        ? params.source[0]
        : undefined;
  if (!isPageDataSource(source)) {
    return (
      <View style={styles.error}>
        <Text style={[styles.errorText, { color: text.error }]}>
          {source == null || source === ""
            ? "Missing source."
            : `Invalid source: ${source}`}
        </Text>
      </View>
    );
  }

  switch (source) {
    case PageDataSource.Ropewiki:
      return (
        <View style={{ flex: 1 }}>
          <RopewikiPageScreen pageId={pageId} source={source} />
        </View>
      );
    default:
      return null;
  }
}

const styles = {
  error: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center" as const,
  },
};
