import { PlaceholderBadgeButton } from "@/components/buttons/nonstandard/PlaceholderBadgeButton";
import { Dimensions, StyleSheet, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BADGES_GRID_MIN_HEIGHT = 320;
const CELL_WIDTH = SCREEN_WIDTH / 2;

/** Skeleton badge grid matching {@link PageBadges} layout. */
export function PlaceholderPageBadges() {
  return (
    <View style={[styles.container, { minHeight: BADGES_GRID_MIN_HEIGHT }]}>
      <View style={styles.row}>
        <View style={styles.cell}>
          <PlaceholderBadgeButton />
        </View>
        <View style={styles.cell}>
          <PlaceholderBadgeButton />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.cell}>
          <PlaceholderBadgeButton />
        </View>
        <View style={styles.cell}>
          <PlaceholderBadgeButton />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.cell}>
          <PlaceholderBadgeButton />
        </View>
        <View style={styles.cell}>
          <PlaceholderBadgeButton />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.cell}>
          <PlaceholderBadgeButton />
        </View>
        <View style={styles.cell}>
          <PlaceholderBadgeButton />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    marginTop: 16,
    width: SCREEN_WIDTH,
    marginLeft: -20,
  },
  row: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    minHeight: BADGES_GRID_MIN_HEIGHT / 3,
  },
  cell: {
    width: CELL_WIDTH,
    paddingHorizontal: 8,
    alignItems: "flex-start",
  },
});
