import { BackButton } from "@/components/buttons/BackButton";
import { FilterBottomSheet } from "@/components/filters/FilterBottomSheet";
import { FilterButton } from "@/components/buttons/FilterButton";
import {
  Method,
  RopeGeoCursorPaginationHttpRequest,
  Service,
} from "ropegeo-common/components";
import { useAppToast } from "@/components/toast";
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
  SearchParams,
  type SearchParamsPosition,
} from "ropegeo-common/models";

const HEADER_BUTTON_SIZE = 44;
const HEADER_BUTTON_GAP = 8;
const SEARCH_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 300;
const LOAD_MORE_THRESHOLD = 100;
/** Persisted distance order without a GPS fix: wait this long, then clear saved search + toast. */
const DISTANCE_GPS_WAIT_MS = 10_000;
const DISTANCE_GPS_TIMEOUT_TOAST =
  "Could not get coordinates of current position, reverting to default filters";

function searchFilterHasValidIncludes(f: SearchFilter): boolean {
  return f.includePages || f.includeRegions;
}

function buildSearchParamsWhenValid(
  f: SearchFilter,
  args: {
    name: string;
    limit: number;
    currentPosition: SearchParamsPosition | null;
  },
): SearchParams | null {
  if (!searchFilterHasValidIncludes(f)) {
    return null;
  }
  if (f.order === "distance" && args.currentPosition == null) {
    return null;
  }
  return f.toSearchParams(args);
}

export function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    getEffectiveSearchFilter,
    searchPersisted,
    persistSearchFilter,
    revision,
  } = useSavedFilters();
  const showToast = useAppToast();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchInputRef = useRef<TextInput>(null);
  const [searchPos, setSearchPos] = useState<SearchParamsPosition | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState<SearchFilter | null>(null);
  /** While the filter sheet is open, keep using the same `/search` params until close (persist still updates). */
  const [frozenSearchParams, setFrozenSearchParams] =
    useState<SearchParams | null>(null);

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

  const searchPosRef = useRef(searchPos);
  searchPosRef.current = searchPos;
  const persistSearchFilterRef = useRef(persistSearchFilter);
  persistSearchFilterRef.current = persistSearchFilter;

  const effectiveSearchFilter = useMemo(
    () =>
      getEffectiveSearchFilter({
        position: searchPos,
        name: debouncedQuery,
      }),
    [getEffectiveSearchFilter, searchPos, debouncedQuery],
  );

  const awaitingDistanceGps =
    effectiveSearchFilter.order === "distance" && searchPos == null;

  const lastValidSearchParamsRef = useRef<SearchParams | null>(null);

  const searchParams = useMemo(() => {
    const built = buildSearchParamsWhenValid(effectiveSearchFilter, {
      name: debouncedQuery,
      limit: SEARCH_LIMIT,
      currentPosition: searchPos,
    });
    if (built != null) {
      lastValidSearchParamsRef.current = built;
      return built;
    }
    const fallback =
      lastValidSearchParamsRef.current ??
      new SearchFilter(null, debouncedQuery).toSearchParams({
        name: debouncedQuery,
        limit: SEARCH_LIMIT,
        currentPosition: searchPos,
      });
    return fallback;
  }, [effectiveSearchFilter, debouncedQuery, searchPos]);

  const searchParamsLiveRef = useRef(searchParams);
  searchParamsLiveRef.current = searchParams;
  const effectiveSearchFilterRef = useRef(effectiveSearchFilter);
  effectiveSearchFilterRef.current = effectiveSearchFilter;

  useEffect(() => {
    if (effectiveSearchFilter.order !== "distance" || searchPos != null) {
      return;
    }
    const t = setTimeout(() => {
      if (searchPosRef.current != null) return;
      if (effectiveSearchFilterRef.current.order !== "distance") return;
      persistSearchFilterRef.current(null);
      showToast({
        variant: "error",
        message: DISTANCE_GPS_TIMEOUT_TOAST,
        durationMs: 8000,
      });
    }, DISTANCE_GPS_WAIT_MS);
    return () => clearTimeout(t);
  }, [effectiveSearchFilter.order, searchPos, showToast]);

  const searchPersistedRef = useRef(searchPersisted);
  searchPersistedRef.current = searchPersisted;

  /** Filter slot + JSON at sheet open — used to discard invalid edits on close. */
  const searchOpeningSnapRef = useRef<{
    persisted: boolean;
    filterJson: string;
  } | null>(null);

  /** Mirrors persisted search slot JSON (`null` when slot is empty). Updated when storage changes. */
  const lastStoredSearchFilterJsonRef = useRef<string | null>(null);
  useEffect(() => {
    if (searchPersisted) {
      lastStoredSearchFilterJsonRef.current = getEffectiveSearchFilter({
        position: searchPos,
        name: debouncedQuery,
      }).toString();
    } else {
      lastStoredSearchFilterJsonRef.current = null;
    }
  }, [
    revision,
    searchPersisted,
    getEffectiveSearchFilter,
    searchPos,
    debouncedQuery,
  ]);

  /** Stable `/search` query identity so we only refetch when `toQueryString()` actually changes. */
  const stableRequestParamsRef = useRef<SearchParams | null>(null);
  const lastRequestQueryKeyRef = useRef<string | null>(null);

  if (!filterSheetOpen) {
    const liveKey = searchParams.toQueryString();
    if (lastRequestQueryKeyRef.current !== liveKey) {
      lastRequestQueryKeyRef.current = liveKey;
      stableRequestParamsRef.current = searchParams;
    }
  }

  const searchParamsForRequest =
    filterSheetOpen && frozenSearchParams != null
      ? frozenSearchParams
      : stableRequestParamsRef.current ?? searchParams;

  const searchDraftRef = useRef(searchDraft);
  searchDraftRef.current = searchDraft;

  const handleSearchDraftChange = useCallback(
    (f: SearchFilter) => {
      setSearchDraft(f);
      if (!searchFilterHasValidIncludes(f)) {
        return;
      }
      if (f.order === "distance" && searchPos == null) {
        return;
      }
      const serialized = SearchFilter.fromJsonString(f.toString()).toString();
      if (searchPersisted) {
        if (lastStoredSearchFilterJsonRef.current === serialized) {
          return;
        }
      } else if (
        lastStoredSearchFilterJsonRef.current === null &&
        serialized ===
          new SearchFilter(searchPos, debouncedQuery).toString()
      ) {
        return;
      }
      persistSearchFilter(SearchFilter.fromJsonString(serialized));
    },
    [searchPos, debouncedQuery, searchPersisted, persistSearchFilter],
  );

  const closeFilterSheet = useCallback(() => {
    const draft = searchDraftRef.current;
    const snap = searchOpeningSnapRef.current;
    const frozen = frozenSearchParams;
    const live = searchParamsLiveRef.current;

    const discardInvalidIncludes =
      draft != null &&
      !searchFilterHasValidIncludes(draft) &&
      snap != null;

    if (discardInvalidIncludes) {
      if (snap.persisted) {
        persistSearchFilter(SearchFilter.fromJsonString(snap.filterJson));
      } else {
        persistSearchFilter(null);
      }
      if (frozen != null) {
        stableRequestParamsRef.current = frozen;
        lastRequestQueryKeyRef.current = frozen.toQueryString();
      }
    } else {
      const liveKey = live.toQueryString();
      if (frozen != null && frozen.toQueryString() === liveKey) {
        stableRequestParamsRef.current = frozen;
        lastRequestQueryKeyRef.current = liveKey;
      } else {
        stableRequestParamsRef.current = live;
        lastRequestQueryKeyRef.current = liveKey;
      }
    }

    setFilterSheetOpen(false);
    setSearchDraft(null);
    setFrozenSearchParams(null);
  }, [frozenSearchParams, persistSearchFilter]);

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

  const openFilterSheet = useCallback(() => {
    searchOpeningSnapRef.current = {
      persisted: searchPersistedRef.current,
      filterJson: effectiveSearchFilterRef.current.toString(),
    };
    setFrozenSearchParams(searchParamsLiveRef.current);
    setSearchDraft(
      SearchFilter.fromJsonString(effectiveSearchFilterRef.current.toString()),
    );
    setFilterSheetOpen(true);
  }, []);

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
        {awaitingDistanceGps ? (
          <View
            style={[
              styles.centered,
              { paddingTop: searchBarTop + searchBarHeight + 12 },
            ]}
          >
            <ActivityIndicator size="large" />
            <Text style={styles.locationWaitText}>Getting your location…</Text>
          </View>
        ) : (
          <RopeGeoCursorPaginationHttpRequest<Preview>
            service={Service.WEBSCRAPER}
            method={Method.GET}
            path="/search"
            queryParams={searchParamsForRequest}
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
        )}
      </Pressable>
      <FilterBottomSheet
        visible={filterSheetOpen}
        onClose={closeFilterSheet}
        mode={
          filterSheetOpen && searchDraft != null
            ? {
                kind: "search",
                draft: searchDraft,
                onDraftChange: handleSearchDraftChange,
                persisted: searchPersisted,
                livePosition: searchPos,
                onRevert: () => {
                  persistSearchFilter(null);
                  setSearchDraft(
                    new SearchFilter(searchPos, debouncedQuery),
                  );
                },
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
  locationWaitText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
});
