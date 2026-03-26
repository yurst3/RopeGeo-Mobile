import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SavedTabHighlightContextValue = {
  highlightSavedTab: boolean;
  setHighlightSavedTab: (value: boolean) => void;
};

const SavedTabHighlightContext =
  createContext<SavedTabHighlightContextValue | null>(null);

export function SavedTabHighlightProvider({ children }: { children: ReactNode }) {
  const [highlightSavedTab, setHighlightSavedTab] = useState(false);

  const value = useMemo(
    () => ({ highlightSavedTab, setHighlightSavedTab }),
    [highlightSavedTab],
  );

  return (
    <SavedTabHighlightContext.Provider value={value}>
      {children}
    </SavedTabHighlightContext.Provider>
  );
}

export function useSavedTabHighlight(): SavedTabHighlightContextValue {
  const ctx = useContext(SavedTabHighlightContext);
  if (ctx == null) {
    throw new Error(
      "useSavedTabHighlight must be used within SavedTabHighlightProvider",
    );
  }
  return ctx;
}
