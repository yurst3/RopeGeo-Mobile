import { RopewikiPageScreen } from "@/components/screens/pages/ropewiki/RopewikiPageScreen";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { PageDataSource } from "ropegeo-common/models";

const VALID_SOURCES = new Set<string>(Object.values(PageDataSource));

function isPageDataSource(value: unknown): value is PageDataSource {
  return typeof value === "string" && VALID_SOURCES.has(value);
}

/**
 * Shared Ropewiki page route: param validation + {@link RopewikiPageScreen}.
 * Used by explore and saved stacks. Explore URLs stay under `/(tabs)/explore/[id]/page`;
 * the Saved tab uses `/(tabs)/saved/[id]/page`.
 */
export default function RopewikiPageRouteScreen() {
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
        <Text style={styles.errorText}>
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
          <RopewikiPageScreen pageId={pageId} />
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
    color: "#6b7280",
    textAlign: "center" as const,
  },
};
