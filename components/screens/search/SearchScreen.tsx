import { BackButton } from "@/components/buttons/BackButton";
import { FilterBottomSheet } from "@/components/filters/FilterBottomSheet";
import { FilterButton } from "@/components/buttons/FilterButton";
import {
  Method,
  RopeGeoCursorPaginationHttpRequest,
  Service,
} from "ropegeo-common/components";
import { useSavedFilters } from "@/context/SavedFiltersContext";
import { FontAwesome5 } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PagePreview } from "@/components/previews/PagePreview";
import { RegionPreview } from "@/components/previews/RegionPreview";
import {
  Preview,
  SearchFilter,
  type SearchParamsPosition,
} from "ropegeo-common/classes";

const HEADER_BUTTON_SIZE = 44;
const HEADER_BUTTON_GAP = 8;
const SEARCH_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 300;
const LOAD_MORE_THRESHOLD = 100;

export function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    getEffectiveSearchFilter,
    searchPersisted,
    persistSearchFilter,
  } = useSavedFilters();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchInputRef = useRef<TextInput>(null);
  const [searchPos, setSearchPos] = useState<SearchParamsPosition | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState<SearchFilter | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || cancelled) return;
      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 20,
        },
        (p) => {
          setSearchPos({
            lat: p.coords.latitude,
            lon: p.coords.longitude,
          });
        },
      );
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  const effectiveSearchFilter = useMemo(
    () =>
      getEffectiveSearchFilter({
        position: searchPos,
        name: debouncedQuery,
      }),
    [getEffectiveSearchFilter, searchPos, debouncedQuery],
  );

  const searchParams = useMemo(
    () =>
      effectiveSearchFilter.toSearchParams({
        name: debouncedQuery,
        limit: SEARCH_LIMIT,
        currentPosition: searchPos,
      }),
    [effectiveSearchFilter, debouncedQuery, searchPos],
  );

  const handleScroll = useCallback(
    (e: {
      nativeEvent: {
        contentOffset: { y: number };
        contentSize: { height: number };
        layoutMeasurement: { height: number };
      };
    }) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const canScroll = contentSize.height > layoutMeasurement.height;
      const isNearBottom =
        contentOffset.y + layoutMeasurement.height >=
        contentSize.height - LOAD_MORE_THRESHOLD;
      if (canScroll && isNearBottom) {
        loadMoreRef.current();
      }
    },
    [],
  );

  const loadMoreRef = useRef<() => void>(() => {});

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }, []),
  );

  const searchBarTop = insets.top + 8;
  const searchBarHeight = 48;

  const openFilterSheet = () => {
    setSearchDraft(
      SearchFilter.fromJsonString(effectiveSearchFilter.toString()),
    );
    setFilterSheetOpen(true);
  };

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
        >
          <BackButton onPress={() => router.back()} />
        </View>
        <View style={styles.searchBar}>
          <FontAwesome5 name="search" size={16} color="#6b7280" />
          <TextInput
            ref={searchInputRef}
            style={styles.searchBarInput}
            placeholder="Search"
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
          <FilterButton persisted={searchPersisted} onPress={openFilterSheet} />
        </View>
      </View>
      <Pressable
        style={styles.content}
        onPress={() => searchInputRef.current?.blur()}
      >
        <RopeGeoCursorPaginationHttpRequest<Preview>
          service={Service.WEBSCRAPER}
          method={Method.GET}
          path="/search"
          queryParams={searchParams}
        >
          {({ loading, loadingMore, data, errors, loadMore }) => {
            loadMoreRef.current = loadMore;
            const items = data;
            return (
              <>
                {loading && items.length === 0 && (
                  <View
                    style={[
                      styles.centered,
                      {
                        paddingTop: searchBarTop + searchBarHeight + 12,
                      },
                    ]}
                  >
                    <ActivityIndicator size="large" />
                  </View>
                )}
                {errors != null && !loading && items.length === 0 && (
                  <View
                    style={[
                      styles.centered,
                      {
                        paddingTop: searchBarTop + searchBarHeight + 12,
                      },
                    ]}
                  >
                    <Text style={styles.errorText}>{errors.message}</Text>
                  </View>
                )}
                {!loading && errors == null && (
                  <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={[
                      styles.scrollContent,
                      { paddingTop: searchBarTop + searchBarHeight + 12 },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                  >
                    {items.length === 0 ? (
                      <Text style={styles.hint}>
                        No results. Try another term or change filters.
                      </Text>
                    ) : null}
                    {items.map((item, index) =>
                      item.isPagePreview() ? (
                        <PagePreview
                          key={`page-${item.id}-${index}`}
                          preview={item}
                        />
                      ) : item.isRegionPreview() ? (
                        <RegionPreview
                          key={`region-${item.id}-${index}`}
                          preview={item}
                        />
                      ) : null,
                    )}
                    {loadingMore ? (
                      <View style={styles.loadMoreIndicator}>
                        <ActivityIndicator size="small" />
                      </View>
                    ) : null}
                  </ScrollView>
                )}
              </>
            );
          }}
        </RopeGeoCursorPaginationHttpRequest>
      </Pressable>
      <FilterBottomSheet
        visible={filterSheetOpen}
        onClose={() => {
          setFilterSheetOpen(false);
          setSearchDraft(null);
        }}
        mode={
          filterSheetOpen && searchDraft != null
            ? {
                kind: "search",
                draft: searchDraft,
                onDraftChange: setSearchDraft,
                persisted: searchPersisted,
                livePosition: searchPos,
                onApply: () => {
                  persistSearchFilter(
                    SearchFilter.fromJsonString(searchDraft.toString()),
                  );
                },
                onRevert: () => persistSearchFilter(null),
              }
            : null
        }
      />
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
  content: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadMoreIndicator: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#dc2626",
    textAlign: "center",
  },
  hint: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 16,
  },
});
