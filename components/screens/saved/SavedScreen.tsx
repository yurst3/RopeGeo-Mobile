import { FilterButton } from "@/components/buttons/FilterButton";
import { PagePreview } from "@/components/previews/PagePreview";
import { useSavedPages } from "@/context/SavedPagesContext";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";

const HEADER_BUTTON_SIZE = 44;
const HEADER_BUTTON_GAP = 8;

export function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { savedEntries } = useSavedPages();
  const [query, setQuery] = useState("");
  const searchBarTop = insets.top + 8;
  const searchBarHeight = 48;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return savedEntries;
    return savedEntries.filter((e) =>
      e.preview.title.toLowerCase().includes(q),
    );
  }, [savedEntries, query]);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.headerRow,
          {
            top: searchBarTop,
          },
        ]}
      >
        <View
          style={[
            styles.headerButtonWrap,
            { width: HEADER_BUTTON_SIZE, marginRight: HEADER_BUTTON_GAP },
          ]}
        />
        <View style={styles.searchBar}>
          <FontAwesome5 name="search" size={16} color="#6b7280" />
          <TextInput
            style={styles.searchBarInput}
            placeholder="Search saved"
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
        <View
          style={[
            styles.headerButtonWrap,
            { width: HEADER_BUTTON_SIZE, marginLeft: HEADER_BUTTON_GAP },
          ]}
        >
          <FilterButton onPress={() => {}} />
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: searchBarTop + searchBarHeight + 12 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>
            {savedEntries.length === 0
              ? "No saved pages yet."
              : "No pages match your search."}
          </Text>
        ) : (
          filtered.map((entry) => (
            <PagePreview
              key={entry.preview.id}
              preview={entry.preview}
              pageHref="saved"
              routeType={entry.routeType}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  headerRow: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  headerButtonWrap: {
    height: HEADER_BUTTON_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    minWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 0,
    minWidth: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 24,
  },
});
