import {
  Method,
  RopeGeoCursorPaginationHttpRequest,
  Service,
} from "ropegeo-common/components";
import { useNetworkRequestToasts } from "@/components/toast/useNetworkRequestToasts";
import { TOAST_HORIZONTAL_INSET } from "@/constants/toast";
import {
  TOAST_KEY_SEARCH_ERROR,
  TOAST_KEY_SEARCH_NO_RESULTS,
  TOAST_KEY_SEARCH_REFRESHING,
} from "@/constants/toastArchetypes";
import { NO_NETWORK_MESSAGE } from "@/lib/network/messages";
import { REQUEST_TIMEOUT_SECONDS } from "@/lib/network/requestTimeout";
import { useToast } from "@/context/ToastContext";
import { OfflineLoadMoreBlockedFooter } from "@/components/lists/OfflineLoadMoreBlockedFooter";
import { PlaceholderPreview } from "@/components/previews/PlaceholderPreview";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { PagePreview } from "@/components/previews/PagePreview";
import { RegionPreview } from "@/components/previews/RegionPreview";
import {
  Preview,
  type OnlinePagePreview,
  type SearchParams,
} from "ropegeo-common/models";

type SearchHttpSectionProps = {
  queryParams: SearchParams;
  searchBarTop: number;
  searchBarHeight: number;
  loadMoreRef: MutableRefObject<() => void>;
  onScroll: (e: {
    nativeEvent: {
      contentOffset: { y: number };
      contentSize: { height: number };
      layoutMeasurement: { height: number };
    };
  }) => void;
  isOnline: boolean;
  /**
   * Refetch after reconnect when search params changed while offline (ropegeo-common
   * `refreshOnReconnect`).
   */
  refreshOnReconnect?: boolean;
};

/**
 * Search results + `/search` request. Keeps network toast side effects in a child so hooks stay valid.
 */
export function SearchHttpSection({
  queryParams,
  searchBarTop,
  searchBarHeight,
  loadMoreRef,
  onScroll,
  isOnline,
  refreshOnReconnect = false,
}: SearchHttpSectionProps) {
  const queryKey = useMemo(() => queryParams.toQueryString(), [queryParams]);

  return (
    <RopeGeoCursorPaginationHttpRequest<Preview>
      key={queryKey}
      service={Service.WEBSCRAPER}
      method={Method.GET}
      path="/search"
      queryParams={queryParams}
      timeoutAfterSeconds={REQUEST_TIMEOUT_SECONDS}
      isOnline={isOnline}
      refreshOnReconnect={refreshOnReconnect}
    >
      {({
        loading,
        loadingMore,
        refreshing,
        data,
        errors,
        loadMore,
        hasMore,
        timeoutCountdown,
        reload,
      }) => (
        <SearchHttpSectionInner
          isOnline={isOnline}
          loading={loading}
          loadingMore={loadingMore}
          refreshing={refreshing}
          data={data}
          errors={errors}
          loadMore={loadMore}
          hasMore={hasMore}
          timeoutCountdown={timeoutCountdown}
          queryParams={queryParams}
          loadMoreRef={loadMoreRef}
          searchBarTop={searchBarTop}
          searchBarHeight={searchBarHeight}
          onScroll={onScroll}
          onRetryRequest={reload}
        />
      )}
    </RopeGeoCursorPaginationHttpRequest>
  );
}

function SearchHttpSectionInner({
  isOnline,
  loading,
  loadingMore,
  refreshing,
  data,
  errors,
  loadMore,
  hasMore,
  timeoutCountdown,
  queryParams,
  loadMoreRef,
  searchBarTop,
  searchBarHeight,
  onScroll,
  onRetryRequest,
}: {
  isOnline: boolean;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  data: Preview[] | null;
  errors: Error | null;
  loadMore: () => void;
  hasMore: boolean;
  timeoutCountdown: number | null;
  queryParams: SearchParams;
  loadMoreRef: MutableRefObject<() => void>;
  searchBarTop: number;
  searchBarHeight: number;
  onScroll: SearchHttpSectionProps["onScroll"];
  onRetryRequest: () => void;
}) {
  const { upsertPill, dismiss } = useToast();
  const scrollYRef = useRef(0);
  const layoutHRef = useRef(0);
  const contentHRef = useRef(0);
  const [listNearBottom, setListNearBottom] = useState(false);

  const updateNearBottomFromMetrics = useCallback(
    (contentOffsetY: number, contentHeight: number, layoutHeight: number) => {
      const canScroll = contentHeight > layoutHeight;
      const isNearBottom =
        contentOffsetY + layoutHeight >= contentHeight - LOAD_MORE_BOTTOM_THRESHOLD;
      const atBottom = !canScroll || isNearBottom;
      setListNearBottom(atBottom);
    },
    [],
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
      if (isOnline) {
        onScroll(e);
      }
    },
    [isOnline, onScroll, updateNearBottomFromMetrics],
  );

  const recheckScrollBottom = useCallback(() => {
    updateNearBottomFromMetrics(
      scrollYRef.current,
      contentHRef.current,
      layoutHRef.current,
    );
    if (isOnline) {
      onScroll({
        nativeEvent: {
          contentOffset: { x: 0, y: scrollYRef.current },
          contentSize: { width: 0, height: contentHRef.current },
          layoutMeasurement: { width: 0, height: layoutHRef.current },
        },
      } as NativeSyntheticEvent<NativeScrollEvent>);
    }
  }, [isOnline, onScroll, updateNearBottomFromMetrics]);

  useNetworkRequestToasts({
    loading,
    errors,
    timeoutCountdown,
    resetKey: queryParams.toQueryString(),
    watchOffline: false,
    errorToastKey: TOAST_KEY_SEARCH_ERROR,
    errorToastTitle: "Error getting search results",
    incrementErrorMultipleOnCollision: true,
    onRetryRequest,
  });

  useEffect(() => {
    if (!refreshing) {
      dismiss(TOAST_KEY_SEARCH_REFRESHING);
      return;
    }
    upsertPill({
      key: TOAST_KEY_SEARCH_REFRESHING,
      variant: "warning",
      message: "Refreshing",
      durationMs: null,
      horizontalInset: TOAST_HORIZONTAL_INSET,
    });
  }, [refreshing, upsertPill, dismiss]);

  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore, loadMoreRef]);

  useEffect(() => {
    if (isOnline) {
      setListNearBottom(false);
    }
  }, [isOnline]);

  const items = data ?? [];
  const isNoNetworkSoft = errors?.message === NO_NETWORK_MESSAGE;
  const showLoadingSkeletons =
    loading && data === null && errors == null;
  const showErrorSkeletons =
    !loading && items.length === 0 && errors != null;
  const showNoResultsOnly =
    !loading && data !== null && errors == null && items.length === 0;
  const showResultsList =
    items.length > 0;
  const showScroll =
    showLoadingSkeletons || showErrorSkeletons || showResultsList;

  const showOfflineLoadMoreBlocked =
    !isOnline && hasMore && items.length > 0 && listNearBottom;
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
    const message = isNoNetworkSoft
      ? NO_NETWORK_MESSAGE
      : (errors?.message ?? "Error");
    upsertPill({
      key: TOAST_KEY_SEARCH_ERROR,
      variant: "error",
      message,
      durationMs: null,
      horizontalInset: TOAST_HORIZONTAL_INSET,
    });
  }, [
    showErrorSkeletons,
    isOnline,
    isNoNetworkSoft,
    errors,
    dismiss,
    upsertPill,
  ]);

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
          {loadingMore ? (
            <PlaceholderPreview key="load-more-footer" />
          ) : null}
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
  );
}

const LOAD_MORE_BOTTOM_THRESHOLD = 100;
const SEARCH_HTTP_PLACEHOLDER_COUNT = 8;

const styles = StyleSheet.create({
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
});
