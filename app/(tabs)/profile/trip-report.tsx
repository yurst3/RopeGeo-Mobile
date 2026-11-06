import {
  type ProfileBadgeId,
  userAvatarBadgeFields,
} from "@/components/screens/profile/BadgesTab";
import { TripReportRecordingProvider } from "@/components/screens/tripReport/TripReportRecordingContext";
import { TripReportScreen } from "@/components/screens/tripReport/TripReportScreen";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { loadTripReport } from "@/utils/tripReport/tripReportStorage";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { TripReport } from "ropegeo-common/models";

const PROFILE_BADGE_IDS: readonly ProfileBadgeId[] = [
  "none",
  "reporter1",
  "reporter2",
  "reporter3",
];

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function profileBadgeFromParam(value: string | string[] | undefined): ProfileBadgeId {
  const raw = firstParam(value);
  return PROFILE_BADGE_IDS.find((id) => id === raw) ?? "none";
}

type LoadedReport = { report: TripReport; isNew: boolean };

/**
 * Opens the saved draft named by `tripReportId`, or starts a new draft when there is none (or
 * the saved one can't be read).
 */
export default function TripReportRoute() {
  const params = useLocalSearchParams<{
    tripReportId?: string;
    selectedBadge?: string;
    displayName?: string;
  }>();
  const { background, loadingIndicator } = useColorTheme();
  const tripReportId = firstParam(params.tripReportId);
  // Temporary pass-through from ProfileScreen. The author's profile will come from the backend.
  const selectedBadge = profileBadgeFromParam(params.selectedBadge);
  const displayName = firstParam(params.displayName) ?? "";

  const [loaded, setLoaded] = useState<LoadedReport | null>(() =>
    tripReportId == null
      ? {
          report: TripReport.createDraft({
            name: displayName,
            ...userAvatarBadgeFields(selectedBadge),
          }),
          isNew: true,
        }
      : null,
  );

  useEffect(() => {
    if (tripReportId == null) return;
    let cancelled = false;
    loadTripReport(tripReportId)
      .then((report) => {
        if (!cancelled) setLoaded({ report, isNew: false });
      })
      .catch((error) => {
        console.warn("[TripReportRoute] couldn't load draft, starting a new one", error);
        if (cancelled) return;
        setLoaded({
          report: TripReport.createDraft({
            name: displayName,
            ...userAvatarBadgeFields(selectedBadge),
          }),
          isNew: true,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [tripReportId, displayName, selectedBadge]);

  if (loaded == null) {
    return (
      <View style={[styles.loading, { backgroundColor: background }]}>
        <ActivityIndicator color={loadingIndicator} />
      </View>
    );
  }

  return (
    <TripReportRecordingProvider>
      <TripReportScreen initialReport={loaded.report} isNew={loaded.isNew} />
    </TripReportRecordingProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
