import {
  TripReportPreview,
  type TripReportPreviewData,
} from "@/components/previews/TripReportPreview";
import { CategoryDivider } from "@/components/lists/CategoryDivider";
import type { ProfileBadgeId } from "@/components/screens/profile/BadgesTab";
import { useTripReportDrafts } from "@/utils/tripReport/tripReportStorage";
import { useMemo } from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import type { TripReportDates, TripReportDraft } from "ropegeo-common/models";

function formatDay(date: Date, withYear: boolean): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : null),
  });
}

/** "Oct 5, 2026", or a range like "Oct 5 – Oct 7, 2026" for multi-day trips. */
function formatTripReportDates({ startDate, endDate }: TripReportDates): string {
  if (endDate == null) return formatDay(startDate, true);
  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  return `${formatDay(startDate, !sameYear)} – ${formatDay(endDate, true)}`;
}

function draftPreviewData(draft: TripReportDraft): TripReportPreviewData {
  return {
    tripReportId: draft.id,
    previewImage: draft.bannerImage,
    title: draft.title,
    date: formatTripReportDates(draft.dates),
    likeCount: 0,
    commentCount: 0,
    publishedStatus: "draft",
  };
}

const MOCK_PUBLISHED: TripReportPreviewData[] = [
  {
    title: "My Trip Report",
    date: "Oct 5, 2026",
    likeCount: 0,
    commentCount: 0,
    publishedStatus: "published",
  },
];

export function TripReportsTab({
  published = MOCK_PUBLISHED,
  selectedBadge,
  displayName,
}: {
  published?: TripReportPreviewData[];
  selectedBadge: ProfileBadgeId | null;
  displayName: string;
}) {
  const savedDrafts = useTripReportDrafts();
  const drafts = useMemo(() => savedDrafts.map(draftPreviewData), [savedDrafts]);

  return (
    <ScrollView
      style={styles.tab}
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
    >
      <CategoryDivider title="Drafts" count={drafts.length} style={styles.category} />
      {drafts.map((preview) => (
        <View key={preview.tripReportId} style={styles.preview}>
          <TripReportPreview
            preview={preview}
            selectedBadge={selectedBadge}
            displayName={displayName}
          />
        </View>
      ))}
      <CategoryDivider
        title="Published"
        count={published.length}
        style={styles.category}
      />
      {published.map((preview, index) => (
        <View key={`published-${index}`} style={styles.preview}>
          <TripReportPreview
            preview={preview}
            selectedBadge={selectedBadge}
            displayName={displayName}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
  },
  tabContent: {
    paddingTop: 8,
    paddingBottom: 88,
  },
  category: {
    paddingHorizontal: 12,
    marginTop: 8,
  },
  preview: {
    paddingHorizontal: 12,
    marginTop: 8,
  },
});
