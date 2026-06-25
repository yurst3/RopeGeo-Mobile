import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  RouteFilter,
  RoutesParams,
  SavedFilters,
  SavedPagesFilter,
  SearchFilter,
  type SearchParamsPosition,
} from "ropegeo-common/models";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "ropegeo:savedFilters";

type LiveSearchArgs = {
  position: SearchParamsPosition | null;
  name: string;
};

type SavedFiltersContextValue = {
  isLoaded: boolean;
  /** Bumps after any explore/search/saved-pages filter is persisted or reverted. */
  revision: number;
  explorePersisted: boolean;
  searchPersisted: boolean;
  savedPagesPersisted: boolean;
  /** Memoized GET /routes params for the Explore map (global scope). */
  exploreRoutesParams: RoutesParams;
  getEffectiveRouteFilterForExplore: () => RouteFilter;
  getEffectiveSearchFilter: (live: LiveSearchArgs) => SearchFilter;
  getEffectiveSavedPagesFilter: () => SavedPagesFilter;
  persistExploreFilter: (filter: RouteFilter | null) => void;
  persistSearchFilter: (filter: SearchFilter | null) => void;
  persistSavedPagesFilter: (filter: SavedPagesFilter | null) => void;
};

const SavedFiltersContext = createContext<SavedFiltersContextValue | null>(null);

async function loadFilters(): Promise<SavedFilters> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw == null || raw === "") return new SavedFilters();
  try {
    return SavedFilters.fromJsonString(raw);
  } catch (e) {
    console.warn("[SavedFilters] invalid storage, resetting", e);
    return new SavedFilters();
  }
}

async function persistFilters(filters: SavedFilters): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, filters.toString());
}

export function SavedFiltersProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<SavedFilters>(new SavedFilters());
  const [isLoaded, setIsLoaded] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const f = await loadFilters();
        if (!cancelled) setSaved(f);
      } catch (e) {
        console.warn("[SavedFilters] load failed", e);
      } finally {
        if (!cancelled) {
          setIsLoaded(true);
          setRevision((r) => r + 1);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const schedulePersist = useCallback((next: SavedFilters) => {
    void (async () => {
      try {
        await persistFilters(next);
      } catch (e) {
        console.warn("[SavedFilters] persist failed", e);
      }
    })();
  }, []);

  const persistExploreFilter = useCallback(
    (filter: RouteFilter | null) => {
      setSaved((prev) => {
        const next = new SavedFilters(filter, prev.search, prev.savedPages);
        schedulePersist(next);
        return next;
      });
      setRevision((r) => r + 1);
    },
    [schedulePersist],
  );

  const persistSearchFilter = useCallback(
    (filter: SearchFilter | null) => {
      setSaved((prev) => {
        const next = new SavedFilters(prev.explore, filter, prev.savedPages);
        schedulePersist(next);
        return next;
      });
      setRevision((r) => r + 1);
    },
    [schedulePersist],
  );

  const persistSavedPagesFilter = useCallback(
    (filter: SavedPagesFilter | null) => {
      setSaved((prev) => {
        const next = new SavedFilters(prev.explore, prev.search, filter);
        schedulePersist(next);
        return next;
      });
      setRevision((r) => r + 1);
    },
    [schedulePersist],
  );

  const explorePersisted = saved.explore !== null;
  const searchPersisted = saved.search !== null;
  const savedPagesPersisted = saved.savedPages !== null;

  const effectiveExploreRouteFilter = useMemo(
    () =>
      saved.explore != null
        ? RouteFilter.fromJsonString(saved.explore.toString())
        : new RouteFilter(),
    [saved.explore],
  );

  const exploreRoutesParams = useMemo(
    () => effectiveExploreRouteFilter.toRoutesParams(),
    [effectiveExploreRouteFilter],
  );

  const getEffectiveRouteFilterForExplore = useCallback((): RouteFilter => {
    return RouteFilter.fromJsonString(effectiveExploreRouteFilter.toString());
  }, [effectiveExploreRouteFilter]);

  const getEffectiveSearchFilter = useCallback(
    (live: LiveSearchArgs): SearchFilter => {
      if (saved.search != null) {
        return SearchFilter.fromJsonString(saved.search.toString());
      }
      return new SearchFilter(live.position, live.name);
    },
    [saved.search],
  );

  const getEffectiveSavedPagesFilter = useCallback((): SavedPagesFilter => {
    return saved.savedPages != null
      ? SavedPagesFilter.fromJsonString(saved.savedPages.toString())
      : SavedPagesFilter.defaultFilter();
  }, [saved.savedPages]);

  const value = useMemo<SavedFiltersContextValue>(
    () => ({
      isLoaded,
      revision,
      explorePersisted,
      searchPersisted,
      savedPagesPersisted,
      exploreRoutesParams,
      getEffectiveRouteFilterForExplore,
      getEffectiveSearchFilter,
      getEffectiveSavedPagesFilter,
      persistExploreFilter,
      persistSearchFilter,
      persistSavedPagesFilter,
    }),
    [
      isLoaded,
      revision,
      explorePersisted,
      searchPersisted,
      savedPagesPersisted,
      exploreRoutesParams,
      getEffectiveRouteFilterForExplore,
      getEffectiveSearchFilter,
      getEffectiveSavedPagesFilter,
      persistExploreFilter,
      persistSearchFilter,
      persistSavedPagesFilter,
    ],
  );

  return (
    <SavedFiltersContext.Provider value={value}>{children}</SavedFiltersContext.Provider>
  );
}

export function useSavedFilters(): SavedFiltersContextValue {
  const ctx = useContext(SavedFiltersContext);
  if (ctx == null) {
    throw new Error("useSavedFilters must be used within SavedFiltersProvider");
  }
  return ctx;
}
