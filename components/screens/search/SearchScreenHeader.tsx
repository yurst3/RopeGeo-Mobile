import { BackButton } from "@/components/buttons/standard/BackButton";
import { FilterButton } from "@/components/buttons/standard/FilterButton";
import { SearchBar } from "@/components/SearchBar";
import { useHeaderChromeLayout, useSearchChromeStackedLayout } from "@/utils/buttonChromeLayout";
import { useFocusEffect, useRouter } from "expo-router";
import {
  forwardRef,
  useCallback,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SearchScreenHeaderProps = {
  query: string;
  onChangeQuery: (next: string) => void;
  searchPersisted: boolean;
  setFilterSheetOpen: Dispatch<SetStateAction<boolean>>;
};

export const SearchScreenHeader = forwardRef<TextInput, SearchScreenHeaderProps>(
  function SearchScreenHeader(
    { query, onChangeQuery, searchPersisted, setFilterSheetOpen },
    searchInputRef,
  ) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const headerChrome = useHeaderChromeLayout();
  const searchChrome = useSearchChromeStackedLayout();
  const inputRef = useRef<TextInput>(null);
  const searchBarTop = insets.top + searchChrome.rowTop;

  const setInputRef = useCallback(
    (node: TextInput | null) => {
      inputRef.current = node;
      if (typeof searchInputRef === "function") {
        searchInputRef(node);
      } else if (searchInputRef) {
        searchInputRef.current = node;
      }
    },
    [searchInputRef],
  );

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }, []),
  );

  return (
    <View style={[styles.headerRow, { top: searchBarTop }]}>
      <View
        style={[
          styles.headerButtonWrap,
          {
            width: headerChrome.buttonSize,
            height: headerChrome.buttonWrapHeight,
            marginRight: headerChrome.gap,
          },
        ]}
      >
        <BackButton onPress={() => router.back()} />
      </View>
      <SearchBar
        ref={setInputRef}
        style={styles.searchBarFlex}
        placeholder="Search"
        value={query}
        onChangeText={onChangeQuery}
      />
      <View
        style={[
          styles.headerButtonWrap,
          {
            width: headerChrome.buttonSize,
            height: headerChrome.buttonWrapHeight,
            marginLeft: headerChrome.gap,
          },
        ]}
      >
        <FilterButton persisted={searchPersisted} onPress={() => setFilterSheetOpen(true)} />
      </View>
    </View>
  );
  },
);

const styles = StyleSheet.create({
  headerRow: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  headerButtonWrap: {
    justifyContent: "center",
    alignItems: "center",
  },
  searchBarFlex: {
    flex: 1,
    minWidth: 0,
  },
});
