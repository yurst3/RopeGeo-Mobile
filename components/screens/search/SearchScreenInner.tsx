import { BackButton } from "@/components/buttons/BackButton";
import { FilterBottomSheet, type FilterSheetMode } from "@/components/filters/FilterBottomSheet";
import { FilterButton } from "@/components/buttons/FilterButton";
import { useNetworkRequestToasts } from "@/components/toast/useNetworkRequestToasts";
import { TOAST_HORIZONTAL_INSET } from "@/constants/toast";
import {
  TOAST_KEY_SEARCH_ERROR,
  TOAST_KEY_SEARCH_NO_RESULTS,
} from "@/constants/toastArchetypes";
import { useToast } from "@/context/ToastContext";
import { OfflineLoadMoreBlockedFooter } from "@/components/lists/OfflineLoadMoreBlockedFooter";
import { PlaceholderPreview } from "@/components/previews/PlaceholderPreview";
import { PagePreview } from "@/components/previews/PagePreview";
import { RegionPreview } from "@/components/previews/RegionPreview";
import { FontAwesome5 } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { NO_NETWORK_MESSAGE } from "@/lib/network/messages";
import { type OnlinePagePreview, Preview } from "ropegeo-common/models";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HEADER_BUTTON_SIZE = 44;
const HEADER_BUTTON_GAP = 8;
const LOAD_MORE_BOTTOM_THRESHOLD = 100;
const SEARCH_HTTP_PLACEHOLDER_COUNT = 8;

type SearchScreenInnerProps = {
  query: string;
  onChangeQuery: (next: string) => void;
  searchPersisted: boolean;
  setFilterSheetOpen: Dispatch<SetStateAction<boolean>>;
  filterSheetOpen: boolean;
  onCloseFilterSheet: () => void;
  filterSheetMode: FilterSheetMode | null;
  awaitingDistanceGps: boolean;
  isOnline: boolean;
  queryKey: string;
  loadingNextPage: boolean;
  data: Preview[] | null;
  errors: Error | null;
  loadNextPage: () => void;
  morePages: boolean;
  timeoutCountdown: number | null;
  onRetryRequest: () => void;
};

export function SearchScreenInner({
  query,
  onChangeQuery,
  searchPersisted,
  setFilterSheetOpen,
  filterSheetOpen,
  onCloseFilterSheet,
  filterSheetMode,
  awaitingDistanceGps,
  isOnline,
  queryKey,
  loadingNextPage,
  data,
  errors,
  loadNextPage,
  morePages,
  timeoutCountdown,
  onRetryRequest,
}: SearchScreenInnerProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isFocused = useIsFocused();
  const { upsertPill, dismiss } = useToast();
  const searchInputRef = useRef<TextInput>(null);
  const searchBarTop = insets.top + 8;
  const searchBarHeight = 48;
  const scrollYRef = useRef(0);
  const layoutHRef = useRef(0);
  const contentHRef = useRef(0);
  const [listNearBottom, setListNearBottom] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }, []),
  );

  useNetworkRequestToasts({
    errors: null,
    timeoutCountdown: null,
    resetKey: "search-connectivity",
    offlineSurfaceActive: isFocused,
  });

  useNetworkRequestToasts({
    errors,
    timeoutCountdown,
    resetKey: queryKey,
    watchOffline: false,
    errorToastKey: TOAST_KEY_SEARCH_ERROR,
    errorToastTitle: "Error getting search results",
    incrementErrorMultipleOnCollision: true,
    onRetryRequest,
  });

  const updateNearBottomFromMetrics = useCallback(
    (contentOffsetY: number, contentHeight: number, layoutHeight: number) => {
      const canScroll = contentHeight > layoutHeight;
      const isNearBottom =
        contentOffsetY + layoutHeight >= contentHeight - LOAD_MORE_BOTTOM_THRESHOLD;
      const atBottom = !canScroll || isNearBottom;
      setListNearBottom(atBottom);
      if (isOnline && canScroll && isNearBottom && morePages && !loadingNextPage) {
        loadNextPage();
      }
    },
    [isOnline, morePages, loadingNextPage, loadNextPage],
  );

  const wrappedOnScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      scrollYRef.current = contentOffset.y;
      layoutHRef.current = layoutMeasurement.height;
      contentHRef.current = contentSize.height;
      updateNearBottomFromMetrics(
        contentOffset.y,
        contentSize.height,
        layoutMeasurement.height,
      );
    },
    [updateNearBottomFromMetrics],
  );

  const recheckScrollBottom = useCallback(() => {
    updateNearBottomFromMetrics(
      scrollYRef.current,
      contentHRef.current,
      layoutHRef.current,
    );
  }, [updateNearBottomFromMetrics]);

  useEffect(() => {
    if (isOnline) {
      setListNearBottom(false);
    }
  }, [isOnline]);

  const items = data ?? [];
  const isNoNetworkSoft = errors?.message === NO_NETWORK_MESSAGE;
  const loading = data === null && errors === null;
  const showLoadingSkeletons = loading;
  const showErrorSkeletons = !loading && items.length === 0 && errors != null;
  const showNoResultsOnly =
    !loading && data !== null && errors == null && items.length === 0;
  const showResultsList = items.length > 0;
  const showScroll = showLoadingSkeletons || showErrorSkeletons || showResultsList;

  const showOfflineLoadMoreBlocked =
    !isOnline && morePages && items.length > 0 && listNearBottom;
  const showErroredLoadMoreBlocked =
    errors != null && items.length > 0 && listNearBottom;

  useEffect(() => {
    if (!showErrorSkeletons) {
      dismiss(TOAST_KEY_SEARCH_ERROR);
      return;
    }
    if (isOnline) {
      return;
    }
    const message = isNoNetworkSoft ? NO_NETWORK_MESSAGE : (errors?.message ?? "Error");
    upsertPill({
      key: TOAST_KEY_SEARCH_ERROR,
      variant: "error",
      message,
      durationMs: null,
      horizontalInset: TOAST_HORIZONTAL_INSET,
    });
  }, [showErrorSkeletons, isOnline, isNoNetworkSoft, errors, dismiss, upsertPill]);

  useEffect(() => {
    if (!showNoResultsOnly) {
      dismiss(TOAST_KEY_SEARCH_NO_RESULTS);
      return;
    }
    upsertPill({
      key: TOAST_KEY_SEARCH_NO_RESULTS,
      variant: "warning",
      message: "No results. Try another term or change filters.",
      durationMs: null,
      horizontalInset: TOAST_HORIZONTAL_INSET,
    });
  }, [showNoResultsOnly, dismiss, upsertPill]);

  return (
    <View style={styles.container}>
      <View style={[styles.headerRow, { top: searchBarTop }]}>
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
            onChangeText={onChangeQuery}
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
          <FilterButton persisted={searchPersisted} onPress={() => setFilterSheetOpen(true)} />
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
          <>
            {showScroll ? (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                  styles.scrollContent,
                  { paddingTop: searchBarTop + searchBarHeight + 12 },
                ]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                onScroll={wrappedOnScroll}
                scrollEventThrottle={16}
                onLayout={(e) => {
                  layoutHRef.current = e.nativeEvent.layout.height;
                  recheckScrollBottom();
                }}
                onContentSizeChange={(_w, h) => {
                  contentHRef.current = h;
                  recheckScrollBottom();
                }}
              >
                {showLoadingSkeletons
                  ? Array.from({ length: SEARCH_HTTP_PLACEHOLDER_COUNT }).map((_, i) => (
                      <PlaceholderPreview key={`sk-${i}`} />
                    ))
                  : null}
                {showErrorSkeletons
                  ? Array.from({ length: SEARCH_HTTP_PLACEHOLDER_COUNT }).map((_, i) => (
                      <PlaceholderPreview key={`err-${i}`} error />
                    ))
                  : null}
                {showResultsList
                  ? items.map((item, index) =>
                      item.isPagePreview() ? (
                        <PagePreview
                          key={`page-${item.id}-${index}`}
                          preview={item as OnlinePagePreview}
                        />
                      ) : item.isRegionPreview() ? (
                        <RegionPreview
                          key={`region-${item.id}-${index}`}
                          preview={item}
                        />
                      ) : null,
                    )
                  : null}
                {loadingNextPage ? <PlaceholderPreview key="load-more-footer" /> : null}
                {showOfflineLoadMoreBlocked || showErroredLoadMoreBlocked ? (
                  <OfflineLoadMoreBlockedFooter />
                ) : null}
              </ScrollView>
            ) : null}
            {showNoResultsOnly ? (
              <View
                style={[
                  styles.noResultsFill,
                  { paddingTop: searchBarTop + searchBarHeight + 12 },
                ]}
              />
            ) : null}
          </>
        )}
      </Pressable>
      <FilterBottomSheet
        visible={filterSheetOpen}
        onClose={onCloseFilterSheet}
        mode={filterSheetMode}
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
  noResultsFill: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  locationWaitText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
});
