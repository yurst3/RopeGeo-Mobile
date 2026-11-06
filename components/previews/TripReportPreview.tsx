import { UserAvatar } from "@/components/user/UserAvatar";
import { TRIP_REPORT_PREVIEW_IMAGE_LAYOUT } from "@/constants/profile/profileImageLayout";
import {
  type ProfileBadgeId,
  userAvatarBadgeFields,
} from "@/components/screens/profile/BadgesTab";
import { ConstantText } from "@/components/text/ConstantText";
import { ScalingText } from "@/components/text/ScalingText";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import {
  PAGE_PREVIEW_TRAILING_MARGIN,
  PREVIEW_TITLE_MAX_LINES,
  usePreviewLayoutMetrics,
} from "@/utils/layout/previewLayout";
import { useFabulousTitle } from "@/utils/theme/useFabulousTitle";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { UserAvatar as UserAvatarModel } from "ropegeo-common/models";

const IMAGE_SIZE = 96;
/** 1 matches the trip report thumbnail. Increase to enlarge, decrease to shrink. */
const PROFILE_IMAGE_SCALE = 0.5;
const DESIGN_STAT_ICON_SIZE = 16;
const TRIP_REPORT_ICON = require("@/assets/images/icons/buttons/tripReport.png");
const DRAFT_ICON = require("@/assets/images/icons/draft.png");
const LIKE_ICON = require("@/assets/images/icons/like.png");
const COMMENT_ICON = require("@/assets/images/icons/comment.png");

export type TripReportPublishedStatus = "draft" | "published";

export type TripReportPreviewData = {
  /** Saved report opened on press; previews without one aren't pressable. */
  tripReportId?: string;
  previewImage?: string;
  title: string;
  date: string;
  likeCount: number;
  commentCount: number;
  publishedStatus: TripReportPublishedStatus;
};

export function TripReportPreview({
  preview,
  selectedBadge,
  displayName,
}: {
  preview: TripReportPreviewData;
  selectedBadge: ProfileBadgeId | null;
  displayName: string;
}) {
  const router = useRouter();
  const themeColors = useColorTheme();
  const layoutMetrics = usePreviewLayoutMetrics();
  const uiScale = useUiScale();
  const style = useTextStyle();
  const { text, image } = themeColors;
  const displayTitle = useFabulousTitle(preview.title);
  const [imageLoading, setImageLoading] = useState(preview.previewImage != null);
  const iconScale = layoutMetrics.sourceIconCircleSize / 32;
  const statIconSize = Math.round(DESIGN_STAT_ICON_SIZE * iconScale);
  const isDraft = preview.publishedStatus === "draft";
  // Temporary: built from the profile until trip report previews carry their author's avatar.
  const author = useMemo(
    () =>
      UserAvatarModel.create({
        name: displayName,
        ...userAvatarBadgeFields(selectedBadge ?? "none"),
      }),
    [displayName, selectedBadge],
  );

  return (
    <Pressable
      disabled={preview.tripReportId == null}
      onPress={() => {
        if (preview.tripReportId == null) return;
        // Temporary: ProfileScreen's badge and display name are forwarded here until the trip report loads its author from the backend.
        router.push({
          pathname: "/profile/trip-report",
          params: {
            tripReportId: preview.tripReportId,
            selectedBadge: selectedBadge ?? "none",
            displayName,
          },
        });
      }}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={preview.title}
    >
      <View style={[styles.imageWrap, { backgroundColor: image.background }]}>
        {preview.previewImage != null ? (
          <>
            {imageLoading ? (
              <View
                style={[styles.imageLoadingOverlay, { backgroundColor: image.background }]}
              >
                <ActivityIndicator size="small" color={themeColors.loadingIndicator} />
              </View>
            ) : null}
            <Image
              source={preview.previewImage}
              style={styles.image}
              contentFit="cover"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
          </>
        ) : (
          <View style={[styles.noImageWrap, { backgroundColor: image.background }]}>
            <Image
              source={TRIP_REPORT_ICON}
              style={{
                width: layoutMetrics.noImageIconSize,
                height: layoutMetrics.noImageIconSize,
                tintColor: image.missingIcon,
              }}
              contentFit="contain"
            />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <ScalingText
          size={uiScale.preview.text.title}
          typography={style.preview.title}
          numberOfLines={PREVIEW_TITLE_MAX_LINES}
          ellipsizeMode="tail"
          containerStyle={styles.titleWrap}
          measure={{
            type: "width",
            widthSafetyMargin: layoutMetrics.widthSafetyMargin,
          }}
          measureTextStyle={styles.titleMeasure}
          style={[styles.title, { color: text.primary }]}
        >
          {displayTitle}
        </ScalingText>
        <ConstantText
          size={uiScale.preview.text.locationHierarchy}
          typography={style.preview.locationHierarchy}
          style={[styles.author, { color: text.secondary }]}
          numberOfLines={1}
        >
          {`by ${displayName}`}
        </ConstantText>
        <ConstantText
          size={uiScale.preview.text.locationHierarchy}
          typography={style.preview.locationHierarchy}
          style={[styles.date, { color: text.secondary }]}
          numberOfLines={1}
        >
          {preview.date}
        </ConstantText>
        {isDraft ? (
          <View style={styles.stat}>
            <Image
              source={DRAFT_ICON}
              style={{
                width: statIconSize,
                height: statIconSize,
                tintColor: text.error,
              }}
              contentFit="contain"
              accessibilityElementsHidden
            />
            <ConstantText
              size={uiScale.preview.text.other}
              typography={style.preview.other}
              style={{ color: text.error }}
            >
              Draft
            </ConstantText>
          </View>
        ) : (
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Image
                source={LIKE_ICON}
                style={{
                  width: statIconSize,
                  height: statIconSize,
                  tintColor: text.secondary,
                }}
                contentFit="contain"
                accessibilityElementsHidden
              />
              <ConstantText
                size={uiScale.preview.text.other}
                typography={style.preview.other}
                style={{ color: text.secondary }}
              >
                {preview.likeCount}
              </ConstantText>
            </View>
            <View style={styles.stat}>
              <Image
                source={COMMENT_ICON}
                style={{
                  width: statIconSize,
                  height: statIconSize,
                  tintColor: text.secondary,
                }}
                contentFit="contain"
                accessibilityElementsHidden
              />
              <ConstantText
                size={uiScale.preview.text.other}
                typography={style.preview.other}
                style={{ color: text.secondary }}
              >
                {preview.commentCount}
              </ConstantText>
            </View>
          </View>
        )}
      </View>
      <View style={styles.profileImage}>
        <UserAvatar
          avatar={author}
          showName={false}
          size={Math.round(IMAGE_SIZE * PROFILE_IMAGE_SCALE)}
          layout={TRIP_REPORT_PREVIEW_IMAGE_LAYOUT}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 12,
    padding: 3,
  },
  cardPressed: {
    opacity: 0.9,
  },
  imageWrap: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  noImageWrap: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    justifyContent: "center",
  },
  titleWrap: {
    marginBottom: 2,
  },
  titleMeasure: {
    textAlign: "center",
  },
  title: {
    textAlign: "left",
  },
  author: {
    marginBottom: 2,
  },
  date: {
    marginBottom: 2,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  profileImage: {
    marginLeft: PAGE_PREVIEW_TRAILING_MARGIN,
  },
});
