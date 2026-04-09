import { RopewikiRegionScreen } from "@/components/screens/regions/ropewiki/RopewikiRegionScreen";
import { useLocalSearchParams } from "expo-router";
import { PageDataSource } from "ropegeo-common/models";
import { Text, View } from "react-native";

const VALID_SOURCES = new Set<string>(Object.values(PageDataSource));

function isPageDataSource(value: unknown): value is PageDataSource {
  return typeof value === "string" && VALID_SOURCES.has(value);
}

export default function RegionRoute() {
  const params = useLocalSearchParams<{
    id: string;
    source: string;
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
        <Text style={styles.errorText}>Missing id.</Text>
      </View>
    );
  }

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
          <RopewikiRegionScreen regionId={regionId} />
        </View>
      );
  }

  return (
    <View style={styles.error}>
      <Text style={styles.errorText}>Unknown source: {source}</Text>
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
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center" as const,
  },
};
