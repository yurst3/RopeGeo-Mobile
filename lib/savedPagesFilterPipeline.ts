import {
  AcaDifficulty,
  AcaDifficultyFilterOptions,
  type DifficultyFilterOptions,
  type PagePreview,
  type SavedPage,
  type SavedPagesFilter,
} from "ropegeo-common/classes";

function previewMatchesDifficulty(
  preview: PagePreview,
  opts: DifficultyFilterOptions | null,
): boolean {
  if (opts == null) return true;
  if (!(opts instanceof AcaDifficultyFilterOptions)) return true;
  const params = opts.toDifficultyParams();
  if (!params.isActive()) return true;
  const d = preview.difficulty;
  if (!(d instanceof AcaDifficulty)) return false;
  if (params.technical.length > 0) {
    if (d.technical == null || !params.technical.includes(d.technical)) {
      return false;
    }
  }
  if (params.water.length > 0) {
    if (d.water == null || !params.water.includes(d.water)) return false;
  }
  if (params.time.length > 0) {
    if (d.time == null || !params.time.includes(d.time)) return false;
  }
  if (params.risk.length > 0) {
    const er = d.effectiveRisk;
    if (er == null || !params.risk.includes(er)) return false;
  }
  return true;
}

function nameMatches(
  preview: PagePreview,
  needle: string,
  includeAka: boolean,
): boolean {
  const q = needle.toLowerCase();
  if (preview.title.toLowerCase().includes(q)) return true;
  if (!includeAka) return false;
  return preview.aka.some((a) => a.toLowerCase().includes(q));
}

/**
 * Client-side filter + sort for the Saved tab (see {@link SavedPagesFilter}).
 * Title search is ephemeral UI state — pass `titleQuery` from the screen, not from persisted filter JSON.
 */
export function applySavedPagesFilter(
  entries: SavedPage[],
  filter: SavedPagesFilter,
  titleQuery: string | null = null,
): SavedPage[] {
  let list = entries.slice();
  const q = titleQuery?.trim() ?? "";
  if (q !== "") {
    list = list.filter((e) =>
      nameMatches(e.preview, q, filter.includeAka),
    );
  }
  if (filter.difficultyOptions != null) {
    list = list.filter((e) =>
      previewMatchesDifficulty(e.preview, filter.difficultyOptions),
    );
  }
  list.sort((a, b) =>
    filter.order === "newest"
      ? b.savedAt - a.savedAt
      : a.savedAt - b.savedAt,
  );
  return list;
}
