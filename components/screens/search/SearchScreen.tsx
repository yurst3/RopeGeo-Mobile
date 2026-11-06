import { type FilterSheetMode } from "@/components/modals/FilterBottomSheet";
import { TOAST_KEY_DISTANCE_GPS_TIMEOUT } from "@/constants/toasts/toastArchetypes";
import {
  ToastKeyCollisionError,
  ToastKeyNotFoundError,
  useToast,
} from "@/context/ui/ToastContext";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useNetworkStatus } from "@/context/app/NetworkStatusContext";
import { SearchScreenHeader } from "@/components/screens/search/SearchScreenHeader";
import {
  SearchScreenResults,
  type SearchResultCategory,
} from "@/components/screens/search/SearchScreenResults";
import { useSavedFilters } from "@/context/data/SavedFiltersContext";
import { useSavedPages } from "@/context/data/SavedPagesContext";
import {
  getInitialPageSelection,
  resolvePageSelection,
  type SelectedPagePreview,
} from "@/utils/navigation/pageSelection";
import * as Location from "expo-location";
import { useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { RopeGeoPagedDataLoader, Method, Service } from "ropegeo-common/components";
import { REQUEST_TIMEOUT_SECONDS } from "@/utils/network/requestTimeout";
import {
  Preview,
  SearchFilter,
  SearchParams,
  type SearchOrder,
  type SearchParamsPosition,
} from "ropegeo-common/models";

const SEARCH_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 300;
/** Persisted distance order without a GPS fix: wait this long, then clear saved search + toast. */
const DISTANCE_GPS_WAIT_MS = 10_000;
const DISTANCE_GPS_TIMEOUT_TOAST =
  "Could not get coordinates of current position, reverting to default filters";

function defaultSearchFilter(
  position: SearchParamsPosition | null,
  name: string,
): SearchFilter {
  return new SearchFilter(position, name);
}

function defaultPageSelectSearchFilter(
  position: SearchParamsPosition | null,
  name: string,
): SearchFilter {
  const filter = new SearchFilter(position, name);
  filter.setIncludePages(true);
  filter.setIncludeRegions(false);
  return filter;
}

/**
 * Page-select filters live only as long as the screen so they never overwrite the
 * saved Explore search filter. Same shape as the saved-filters search slot.
 */
function usePageSelectSearchFilters() {
  const [saved, setSaved] = useState<SearchFilter | null>(null);
  const [revision, setRevision] = useState(0);

  const getEffectiveSearchFilter = useCallback(
    (live: { position: SearchParamsPosition | null; name: string }) =>
      saved != null
        ? SearchFilter.fromJsonString(saved.toString())
        : defaultPageSelectSearchFilter(live.position, live.name),
    [saved],
  );

  const persistSearchFilter = useCallback((filter: SearchFilter | null) => {
    setSaved(filter);
    setRevision((r) => r + 1);
  }, []);

  return {
    getEffectiveSearchFilter,
    searchPersisted: saved != null,
    persistSearchFilter,
    revision,
  };
}

function searchResultsCategoryTitle(order: SearchOrder, name: string): string {
  const hasQuery = name.length > 0;
  switch (order) {
    case "distance":
      return hasQuery ? "Nearby Search Results" : "Nearby";
    case "quality":
      return hasQuery ? "Most Popular Search Results" : "Most Popular";
    case "similarity":
      return "Search Results";
  }
}

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

export type SearchScreenProps = {
  /** Present when picking pages for another screen; results are pages only. */
  pageSelect?: { requestId: string };
};

export function SearchScreen({ pageSelect }: SearchScreenProps = {}) {
  const themeColors = useColorTheme();
  const navigation = useNavigation();
  const savedFilters = useSavedFilters();
  const { savedEntries } = useSavedPages();
  const pageSelectFilters = usePageSelectSearchFilters();
  const isPageSelect = pageSelect != null;
  const {
    getEffectiveSearchFilter,
    searchPersisted,
    persistSearchFilter,
    revision,
  } = isPageSelect ? pageSelectFilters : savedFilters;
  const createDefaultSearchFilter = isPageSelect
    ? defaultPageSelectSearchFilter
    : defaultSearchFilter;
  const pageSelectRequestId = pageSelect?.requestId;
  const [selectedPages, setSelectedPages] = useState<SelectedPagePreview[]>(() =>
    pageSelectRequestId != null ? getInitialPageSelection(pageSelectRequestId) : [],
  );
  const selectedPagesRef = useRef(selectedPages);
  selectedPagesRef.current = selectedPages;
  const selectedPageIds = useMemo(
    () => new Set(selectedPages.map((page) => page.id)),
    [selectedPages],
  );
  const togglePageSelected = useCallback((page: SelectedPagePreview) => {
    setSelectedPages((current) =>
      current.some((p) => p.id === page.id)
        ? current.filter((p) => p.id !== page.id)
        : [...current, page],
    );
  }, []);

  useEffect(() => {
    if (pageSelectRequestId == null) return;
    return navigation.addListener("beforeRemove", () => {
      resolvePageSelection(pageSelectRequestId, selectedPagesRef.current);
    });
  }, [navigation, pageSelectRequestId]);
  const { showPill: showToast, updateToast } = useToast();
  const { isOnline } = useNetworkStatus();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchPos, setSearchPos] = useState<SearchParamsPosition | null>(null);
  const searchInputRef = useRef<TextInput>(null);
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
      createDefaultSearchFilter(null, debouncedQuery).toSearchParams({
        name: debouncedQuery,
        limit: SEARCH_LIMIT,
        currentPosition: searchPos,
      });
    return fallback;
  }, [effectiveSearchFilter, debouncedQuery, searchPos, createDefaultSearchFilter]);

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
      try {
        showToast({
          key: TOAST_KEY_DISTANCE_GPS_TIMEOUT,
          message: DISTANCE_GPS_TIMEOUT_TOAST,
          durationMs: null,
        });
      } catch (error) {
        if (!(error instanceof ToastKeyCollisionError)) {
          throw error;
        }
        try {
          updateToast(TOAST_KEY_DISTANCE_GPS_TIMEOUT, {
            variant: "pill",
            message: DISTANCE_GPS_TIMEOUT_TOAST,
            durationMs: null,
          });
        } catch (updateError) {
          if (!(updateError instanceof ToastKeyNotFoundError)) {
            throw updateError;
          }
        }
      }
    }, DISTANCE_GPS_WAIT_MS);
    return () => clearTimeout(t);
  }, [effectiveSearchFilter.order, searchPos, showToast, updateToast]);

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
          createDefaultSearchFilter(searchPos, debouncedQuery).toString()
      ) {
        return;
      }
      persistSearchFilter(SearchFilter.fromJsonString(serialized));
    },
    [
      searchPos,
      debouncedQuery,
      searchPersisted,
      persistSearchFilter,
      createDefaultSearchFilter,
    ],
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

  useEffect(() => {
    if (!filterSheetOpen || searchDraft != null) return;
    searchOpeningSnapRef.current = {
      persisted: searchPersistedRef.current,
      filterJson: effectiveSearchFilterRef.current.toString(),
    };
    setFrozenSearchParams(searchParamsLiveRef.current);
    setSearchDraft(
      SearchFilter.fromJsonString(effectiveSearchFilterRef.current.toString()),
    );
  }, [filterSheetOpen, searchDraft]);

  const queryKey = searchParamsForRequest.toQueryString();
  const resultsCategoryTitle = searchResultsCategoryTitle(
    searchParamsForRequest.order,
    searchParamsForRequest.name,
  );
  const showSavedCategory = isPageSelect && searchParamsForRequest.name.length === 0;
  const leadingCategories = useMemo<SearchResultCategory[]>(
    () =>
      showSavedCategory
        ? [
            {
              key: "saved",
              title: "Saved",
              count: savedEntries.length,
              previews: savedEntries.map((entry) => entry.preview),
            },
          ]
        : [],
    [showSavedCategory, savedEntries],
  );
  const filterSheetMode: FilterSheetMode | null =
    filterSheetOpen && searchDraft != null
      ? {
          kind: isPageSelect ? "page-select-search" : "search",
          draft: searchDraft,
          onDraftChange: handleSearchDraftChange,
          persisted: searchPersisted,
          livePosition: searchPos,
          onRevert: () => {
            persistSearchFilter(null);
            setSearchDraft(createDefaultSearchFilter(searchPos, debouncedQuery));
          },
        }
      : null;

  return (
    <View style={[styles.screen, { backgroundColor: themeColors.background }]}>
      <SearchScreenHeader
        ref={searchInputRef}
        query={query}
        onChangeQuery={setQuery}
        searchPersisted={searchPersisted}
        setFilterSheetOpen={setFilterSheetOpen}
      />
      <RopeGeoPagedDataLoader<Preview>
        service={Service.WEBSCRAPER}
        method={Method.GET}
        onlinePath="/search"
        queryParams={searchParamsForRequest}
        timeoutAfterSeconds={REQUEST_TIMEOUT_SECONDS}
        isOnline={isOnline}
      >
        {({
          loadingNextPage,
          data,
          errors,
          loadNextPage,
          morePages,
          timeoutCountdown,
          reload,
        }) => (
          <SearchScreenResults
            filterSheetOpen={filterSheetOpen}
            onCloseFilterSheet={closeFilterSheet}
            filterSheetMode={filterSheetMode}
            awaitingDistanceGps={awaitingDistanceGps}
            resultsCategoryTitle={resultsCategoryTitle}
            leadingCategories={leadingCategories}
            selection={
              isPageSelect
                ? { selectedIds: selectedPageIds, onToggle: togglePageSelected }
                : undefined
            }
            isOnline={isOnline}
            queryKey={queryKey}
            loadingNextPage={loadingNextPage}
            data={data}
            errors={errors}
            loadNextPage={loadNextPage}
            morePages={morePages}
            timeoutCountdown={timeoutCountdown}
            onRetryRequest={reload}
            onDismissKeyboard={() => searchInputRef.current?.blur()}
          />
        )}
      </RopeGeoPagedDataLoader>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});

