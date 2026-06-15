import { SearchBar, getSearchBarHeight } from "@/components/SearchBar";
import { FilterBottomSheet } from "@/components/filters/FilterBottomSheet";
import { FilterButton } from "@/components/buttons/standard/FilterButton";
import { PagePreview } from "@/components/previews/PagePreview";
import { TOAST_KEY_NETWORK_OFFLINE } from "@/constants/toasts/toastArchetypes";
import { useColorTheme } from "@/context/ColorThemeContext";
import { useSavedFilters } from "@/context/SavedFiltersContext";
import { useSavedPages } from "@/context/SavedPagesContext";
import { useToast } from "@/context/ToastContext";
import { applySavedPagesFilter } from "@/lib/savedPagesFilterPipeline";
import { usePreviewTextMetrics } from "@/utils/previewLayout";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SavedPagesFilter } from "ropegeo-common/models";

const HEADER_BUTTON_SIZE = 44;
const HEADER_BUTTON_GAP = 8;

export function SavedScreen() {
  const { background, text } = useColorTheme();
  const previewMetrics = usePreviewTextMetrics();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const { dismiss } = useToast();
  const { savedEntries } = useSavedPages();
  const {
    getEffectiveSavedPagesFilter,
    savedPagesPersisted,
    persistSavedPagesFilter,
    revision,
  } = useSavedFilters();
  const [nameInput, setNameInput] = useState("");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [savedDraft, setSavedDraft] = useState<SavedPagesFilter | null>(null);

  const persistedSavedFilter = useMemo(() => {
    return SavedPagesFilter.fromJsonString(
      getEffectiveSavedPagesFilter().toString(),
    );
  }, [getEffectiveSavedPagesFilter, revision]);

  const filtered = useMemo(
    () =>
      applySavedPagesFilter(
        savedEntries,
        persistedSavedFilter,
        nameInput.trim() === "" ? null : nameInput.trim(),
      ),
    [savedEntries, persistedSavedFilter, nameInput],
  );

  const searchBarTop = insets.top + 8;
  const searchBarHeight = getSearchBarHeight(fontScale);

  useFocusEffect(
    useCallback(() => {
      dismiss(TOAST_KEY_NETWORK_OFFLINE);
    }, [dismiss]),
  );

  const openFilterSheet = () => {
    const d = SavedPagesFilter.fromJsonString(
      getEffectiveSavedPagesFilter().toString(),
    );
    setSavedDraft(d);
    setFilterSheetOpen(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
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
        <SearchBar
          style={styles.searchBarFlex}
          placeholder="Search saved"
          value={nameInput}
          onChangeText={setNameInput}
        />
        <View
          style={[
            styles.headerButtonWrap,
            { width: HEADER_BUTTON_SIZE, marginLeft: HEADER_BUTTON_GAP },
          ]}
        >
          <FilterButton persisted={savedPagesPersisted} onPress={openFilterSheet} />
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: searchBarTop + searchBarHeight + 12,
            gap: previewMetrics.itemGap,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 ? (
          <Text style={[styles.emptyText, { color: text.secondary }]}>
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
              showMiniDownload
            />
          ))
        )}
      </ScrollView>
      <FilterBottomSheet
        visible={filterSheetOpen}
        onClose={() => {
          setFilterSheetOpen(false);
          setSavedDraft(null);
        }}
        mode={
          filterSheetOpen && savedDraft != null
            ? {
                kind: "saved-pages",
                draft: savedDraft,
                onDraftChange: (f) => {
                  setSavedDraft(f);
                  persistSavedPagesFilter(
                    SavedPagesFilter.fromJsonString(f.toString()),
                  );
                },
                persisted: savedPagesPersisted,
                onRevert: () => {
                  persistSavedPagesFilter(null);
                  setSavedDraft(SavedPagesFilter.defaultFilter());
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
  searchBarFlex: {
    flex: 1,
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
    textAlign: "center",
    marginTop: 24,
  },
});
