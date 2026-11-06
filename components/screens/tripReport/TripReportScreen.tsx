import { AddMapBlockButton } from "@/components/buttons/nonstandard/AddMapBlockButton";
import { AddMediaBlockButton } from "@/components/buttons/nonstandard/AddMediaBlockButton";
import { AddRelevantPageButton } from "@/components/buttons/nonstandard/AddRelevantPageButton";
import { AddTextBlockButton } from "@/components/buttons/nonstandard/AddTextBlockButton";
import { DeleteTripReportButton } from "@/components/buttons/nonstandard/DeleteTripReportButton";
import { ConfirmationModal } from "@/components/modals/confirmation/ConfirmationModal";
import { BackButton } from "@/components/buttons/standard/BackButton";
import { ViewEditButton } from "@/components/buttons/standard/ViewEditButton";
import { FilterCheckbox } from "@/components/filters/FilterCheckbox";
import { TapOutsideRoot } from "@/components/gestures/TapOutside";
import { CategoryDivider } from "@/components/lists/CategoryDivider";
import { MapBlock } from "@/components/screens/tripReport/MapBlock";
import { SelectedPagesList } from "@/components/screens/tripReport/SelectedPagesList";
import { TextBlock } from "@/components/screens/tripReport/TextBlock";
import { USER_AVATAR_DESIGN_SIZE, UserAvatar } from "@/components/user/UserAvatar";
import { ConstantText } from "@/components/text/ConstantText";
import { ScalingText } from "@/components/text/ScalingText";
import { DateInput } from "@/components/widgets/DateInput";
import { TextInput } from "@/components/widgets/TextInput";
import { PROFILE_SCREEN_IMAGE_LAYOUT } from "@/constants/profile/profileImageLayout";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useHeaderChromeLayout } from "@/utils/layout/buttonChromeLayout";
import { requestPageSelection } from "@/utils/navigation/pageSelection";
import { deleteTripReport } from "@/utils/tripReport/tripReportStorage";
import { useTripReportAutosave } from "@/utils/tripReport/useTripReportAutosave";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { useFabulousTitle } from "@/utils/theme/useFabulousTitle";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  addDays,
  DEFAULT_TRIP_REPORT_TITLE,
  MAX_TRIP_REPORT_MAP_BLOCKS,
  TripReport,
  type TripReportPage,
  TripReportMapBlock,
  TripReportTextBlock,
} from "ropegeo-common/models";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STARTING_HEIGHT = Math.round(SCREEN_HEIGHT * 0.5);
const BANNER_HEIGHT_MAX = SCREEN_HEIGHT;
const CARD_BORDER_RADIUS = 24;
const BANNER_EDGE_INSET = 8;
const BANNER_BORDER_RADIUS = 16;
const SCROLL_HORIZONTAL_PADDING = 16;
/** 1 matches the profile header. Increase to enlarge, decrease to shrink. */
const PROFILE_IMAGE_SCALE = 0.6;
const TITLE_MAX_LINES = 2;
const CAMERA_ICON = require("@/assets/images/icons/camera.png");
const NO_IMAGE_ICON = require("@/assets/images/icons/noImage.png");

function bannerHeight(scrollOffset: number, startHeight: number, minHeight: number) {
  "worklet";
  return Math.max(minHeight, Math.min(BANNER_HEIGHT_MAX, startHeight - scrollOffset));
}

export function TripReportScreen({
  initialReport,
  isNew,
}: {
  initialReport: TripReport;
  /** True when `initialReport` hasn't been saved yet; it's saved right away as a draft. */
  isNew: boolean;
}) {
  const { background, image, text, separator } = useColorTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerChrome = useHeaderChromeLayout();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const iconSizeScale = useResolvedIconSizeScale();
  const profileImageSize = Math.round(
    USER_AVATAR_DESIGN_SIZE * iconSizeScale * PROFILE_IMAGE_SCALE,
  );
  // Saved locally as a draft on every change. This will sync with the backend through the API
  // once trip report persistence exists there.
  const [report, setReport] = useState(initialReport);
  // Typing only updates the local draft (re-rendering the whole report per keystroke made the
  // input lag); the title reaches the report on blur. Autosave also folds in a title still being
  // typed, so leaving the screen with the title focused keeps the edit. A blank title is a
  // validation error, which autosave skips, so the last valid title is kept instead.
  const [titleDraft, setTitleDraft] = useState(initialReport.title);
  const { stopAutosave } = useTripReportAutosave(
    report,
    isNew ? null : initialReport,
    (current) => {
      const trimmed = titleDraft.trim();
      return current.title === trimmed ? current : current.withTitle(trimmed);
    },
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const deleteReport = () => {
    setConfirmingDelete(false);
    stopAutosave();
    deleteTripReport(report.id)
      .catch((error) => console.warn("[TripReportScreen] delete failed", error))
      .finally(() => router.back());
  };
  const [reorderingPages, setReorderingPages] = useState(false);
  const expandAnchorRef = useRef<View>(null);
  const [expandedMapBlockId, setExpandedMapBlockId] = useState<string | null>(null);
  const mapExpanded = expandedMapBlockId != null;
  const [editing, setEditing] = useState(true);
  const { dates } = report;
  const author = report.userAvatar[0];
  const displayTitle = useFabulousTitle(report.title);

  const setRelevantPages = (pages: TripReportPage[]) => {
    setReport((current) => current.withRelevantPages(pages));
  };

  const updateTextBlock = (
    blockId: string,
    update: (block: TripReportTextBlock) => TripReportTextBlock,
  ) => {
    setReport((current) =>
      current.withBlockUpdated(blockId, (block) =>
        block instanceof TripReportTextBlock ? update(block) : block,
      ),
    );
  };

  const updateMapBlock = (
    blockId: string,
    update: (block: TripReportMapBlock) => TripReportMapBlock,
  ) => {
    setReport((current) =>
      current.withBlockUpdated(blockId, (block) =>
        block instanceof TripReportMapBlock ? update(block) : block,
      ),
    );
  };

  const openPageSelect = () => {
    const requestId = requestPageSelection({
      initialPages: report.relevantPages,
      onResult: setRelevantPages,
    });
    router.push({ pathname: "/profile/page-select", params: { requestId } });
  };

  const commitTitle = () => {
    const trimmed = titleDraft.trim();
    setTitleDraft(trimmed);
    setReport((current) => (current.title === trimmed ? current : current.withTitle(trimmed)));
  };

  const onStartDateChange = (date: Date) => {
    setReport((current) => current.withDates(current.dates.withStartDate(date)));
  };

  const onEndDateChange = (date: Date) => {
    setReport((current) => current.withDates(current.dates.withEndDate(date)));
  };

  const toggleMultipleDays = () => {
    setReport((current) =>
      current.withDates(current.dates.withMultipleDays(!current.dates.isMultipleDays)),
    );
  };
  const [cardHeight, setCardHeight] = useState<number | null>(null);
  const [bannerContentHeight, setBannerContentHeight] = useState(0);
  /** Profile image plus its name, which hangs half over the banner. */
  const [avatarBlockHeight, setAvatarBlockHeight] = useState(0);
  const scrollY = useSharedValue(0);
  const startHeightSv = useSharedValue(STARTING_HEIGHT);
  const minBannerHeightSv = useSharedValue(0);
  const topInsetSv = useSharedValue(insets.top);

  const bottomPadding = insets.bottom + 16;
  const paddingTop =
    cardHeight != null && cardHeight < SCREEN_HEIGHT / 2
      ? Math.max(0, SCREEN_HEIGHT - cardHeight - bottomPadding)
      : STARTING_HEIGHT;

  useEffect(() => {
    startHeightSv.value = paddingTop;
  }, [paddingTop, startHeightSv]);

  useEffect(() => {
    topInsetSv.value = insets.top;
  }, [insets.top, topInsetSv]);

  useEffect(() => {
    minBannerHeightSv.value =
      bannerContentHeight + insets.top + BANNER_EDGE_INSET + CARD_BORDER_RADIUS;
  }, [bannerContentHeight, insets.top, minBannerHeightSv]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const bannerAnimatedStyle = useAnimatedStyle(() => {
    const height = bannerHeight(scrollY.value, startHeightSv.value, minBannerHeightSv.value);
    return {
      height,
      width: SCREEN_WIDTH,
      left: 0,
    };
  });

  const bannerBorderAnimatedStyle = useAnimatedStyle(() => {
    const height = bannerHeight(scrollY.value, startHeightSv.value, minBannerHeightSv.value);
    const top = topInsetSv.value;
    return {
      top,
      left: BANNER_EDGE_INSET,
      width: SCREEN_WIDTH - BANNER_EDGE_INSET * 2,
      height: Math.max(0, height - top - BANNER_EDGE_INSET - CARD_BORDER_RADIUS),
    };
  });

  return (
    <TapOutsideRoot style={[styles.container, { backgroundColor: background }]}>
      <View
        ref={expandAnchorRef}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        collapsable={false}
      />
      <Animated.View pointerEvents="none" style={[styles.bannerWrap, bannerAnimatedStyle]}>
        {report.bannerImage != null ? (
          <Image
            source={report.bannerImage}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <>
            <View style={[styles.bannerNoImage, { backgroundColor: image.background }]} />
            <Animated.View
              style={[
                styles.bannerBorder,
                bannerBorderAnimatedStyle,
                editing
                  ? { borderColor: text.secondary }
                  : styles.bannerBorderHidden,
              ]}
            >
              <View
                style={styles.bannerContent}
                onLayout={(event) => {
                  const next = Math.ceil(event.nativeEvent.layout.height);
                  setBannerContentHeight((current) => (current === next ? current : next));
                }}
              >
                {editing ? (
                  <>
                    <Image
                      source={CAMERA_ICON}
                      style={[styles.bannerNoImageIcon, { tintColor: image.missingIcon }]}
                      contentFit="contain"
                    />
                    <ConstantText
                      size={uiScale.pageScreen.text.metaData}
                      typography={textStyle.pageScreen.metaData}
                      style={[styles.bannerPrompt, { color: image.missingText }]}
                    >
                      Add a banner image for this trip report
                    </ConstantText>
                  </>
                ) : (
                  <Image
                    source={NO_IMAGE_ICON}
                    style={[styles.bannerNoImageIcon, { tintColor: image.missingIcon }]}
                    contentFit="contain"
                    accessibilityLabel="No banner image"
                  />
                )}
              </View>
            </Animated.View>
          </>
        )}
      </Animated.View>
      <AnimatedScrollView
        style={[styles.scroll, mapExpanded && styles.scrollMapExpanded]}
        contentContainerStyle={{
          paddingTop,
          paddingBottom: 0,
          flexGrow: 1,
        }}
        pointerEvents={mapExpanded ? "box-none" : "auto"}
        onScroll={scrollHandler}
        scrollEnabled={!reorderingPages && !mapExpanded}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >
        <View
          style={styles.card}
          onLayout={(event) => {
            const next = event.nativeEvent.layout.height;
            setCardHeight((current) => (current === next ? current : next));
          }}
        >
          <View
            style={[
              styles.cardInner,
              {
                backgroundColor: background,
                paddingBottom: bottomPadding,
                paddingTop:
                  Math.max(profileImageSize, avatarBlockHeight) - profileImageSize / 2 + 16,
              },
            ]}
          >
            <View style={styles.fields}>
              {editing ? (
                <TextInput
                  value={titleDraft}
                  onChangeText={setTitleDraft}
                  onBlur={commitTitle}
                  placeholder="Enter a title"
                  size={uiScale.pageScreen.text.title}
                  hintSize={uiScale.filter.text.sectionTitle}
                  typography={textStyle.pageScreen.title}
                  accessibilityLabel="Trip report title"
                  align="left"
                  minWidth={(SCREEN_WIDTH / 2) - SCROLL_HORIZONTAL_PADDING}
                  maxWidth={SCREEN_WIDTH - SCROLL_HORIZONTAL_PADDING * 2}
                  title="Title"
                />
              ) : (
                <ScalingText
                  size={uiScale.pageScreen.text.scalingTitle}
                  typography={textStyle.pageScreen.title}
                  numberOfLines={TITLE_MAX_LINES}
                  ellipsizeMode="tail"
                  measure={{ type: "lineCount", maxLinesAtMaxSize: TITLE_MAX_LINES }}
                  containerStyle={styles.viewTitle}
                  style={{ color: text.primary }}
                >
                  {displayTitle}
                </ScalingText>
              )}
              <View style={styles.dateGroup}>
                <View style={styles.dateRow}>
                  <DateInput
                    value={dates.startDate}
                    onChange={onStartDateChange}
                    size={uiScale.filter.text.sectionTitle}
                    typography={textStyle.filter.optionLabel}
                    accessibilityLabel={dates.isMultipleDays ? "Start date" : "Date of trip"}
                    title={dates.isMultipleDays ? "Start Date" : "Date of Trip"}
                    maximumDate={
                      dates.endDate != null ? addDays(dates.endDate, -1) : undefined
                    }
                  />
                  {dates.endDate != null ? (
                    <DateInput
                      value={dates.endDate}
                      onChange={onEndDateChange}
                      size={uiScale.filter.text.sectionTitle}
                      typography={textStyle.filter.optionLabel}
                      accessibilityLabel="End date"
                      title="End Date"
                      minimumDate={addDays(dates.startDate, 1)}
                    />
                  ) : null}
                </View>
                <Pressable
                  style={styles.checkboxRow}
                  onPress={toggleMultipleDays}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: dates.isMultipleDays }}
                  accessibilityLabel="Multiple days"
                >
                  <FilterCheckbox checked={dates.isMultipleDays} />
                  <ConstantText
                    size={uiScale.filter.text.sectionTitle}
                    typography={textStyle.filter.optionLabel}
                    style={{ color: text.primary }}
                  >
                    Multiple Days
                  </ConstantText>
                </Pressable>
              </View>
              <View style={styles.section}>
                <CategoryDivider
                  title="Relevant Pages"
                  count={report.relevantPages.length}
                />
                <SelectedPagesList
                  pages={report.relevantPages}
                  onReorder={setRelevantPages}
                  onRemove={(pageId) =>
                    setReport((current) => current.withoutRelevantPage(pageId))
                  }
                  onDragActiveChange={setReorderingPages}
                />
                <AddRelevantPageButton onPress={openPageSelect} />
                <View style={[styles.sectionEnd, { backgroundColor: separator }]} />
              </View>
              {report.blocks.map((block) =>
                block instanceof TripReportTextBlock ? (
                  <TextBlock
                    key={block.id}
                    header={block.header}
                    body={block.body}
                    onChangeHeader={(header) =>
                      updateTextBlock(block.id, (b) => b.withHeader(header))
                    }
                    onChangeBody={(body) => updateTextBlock(block.id, (b) => b.withBody(body))}
                    onRemove={() => setReport((current) => current.withBlockRemoved(block.id))}
                  />
                ) : block instanceof TripReportMapBlock ? (
                  <MapBlock
                    key={block.id}
                    tripReportId={report.id}
                    block={block}
                    onChange={(update) => updateMapBlock(block.id, update)}
                    expandAnchorRef={expandAnchorRef}
                    onExpandedChange={(expanded) =>
                      setExpandedMapBlockId((current) =>
                        expanded ? block.id : current === block.id ? null : current,
                      )
                    }
                    onRemove={() => setReport((current) => current.withBlockRemoved(block.id))}
                  />
                ) : null,
              )}
              <View style={styles.addBlockRow}>
                <AddTextBlockButton
                  onPress={() =>
                    setReport((current) =>
                      current.withBlockAdded(TripReportTextBlock.createEmpty()),
                    )
                  }
                />
                <AddMediaBlockButton onPress={() => {}} />
                <AddMapBlockButton
                  onPress={() =>
                    setReport((current) =>
                      current.withBlockAdded(TripReportMapBlock.createEmpty()),
                    )
                  }
                  maxMaps={MAX_TRIP_REPORT_MAP_BLOCKS}
                  limitReached={!report.canAddMapBlock}
                />
              </View>
              <View style={styles.deleteRow}>
                <DeleteTripReportButton onPress={() => setConfirmingDelete(true)} />
              </View>
            </View>
          </View>
          {/* Hidden, not unmounted, while a map is expanded: its height sets the card's top
              padding, and a layout shift would move the expanded map off screen. */}
          <View
            pointerEvents="box-none"
            style={[
              styles.profileImage,
              { top: -profileImageSize / 2 },
              mapExpanded && styles.hidden,
            ]}
            onLayout={(event) => {
              const next = Math.ceil(event.nativeEvent.layout.height);
              setAvatarBlockHeight((current) => (current === next ? current : next));
            }}
          >
            {author != null ? (
              <UserAvatar
                avatar={author}
                showName={true}
                size={profileImageSize}
                layout={PROFILE_SCREEN_IMAGE_LAYOUT}
              />
            ) : null}
          </View>
        </View>
      </AnimatedScrollView>
      {!mapExpanded ? (
        <>
          <BackButton
            handleHardwareBack
            top={insets.top + headerChrome.rowTopInset}
          />
          <ViewEditButton
            editing={editing}
            onPress={() => setEditing((current) => !current)}
            style={[
              styles.viewEditButton,
              {
                top: insets.top + headerChrome.rowTopInset,
                right: insets.right + headerChrome.edgeInset,
              },
            ]}
          />
        </>
      ) : null}
      <ConfirmationModal
        visible={confirmingDelete}
        title="Delete trip report?"
        message={`"${report.title.trim() || DEFAULT_TRIP_REPORT_TITLE}" will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={deleteReport}
        onCancel={() => setConfirmingDelete(false)}
      />
    </TapOutsideRoot>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bannerWrap: {
    position: "absolute",
    top: 0,
    overflow: "hidden",
    zIndex: 0,
  },
  bannerBorder: {
    position: "absolute",
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: BANNER_BORDER_RADIUS,
    justifyContent: "center",
    alignItems: "center",
  },
  bannerBorderHidden: {
    borderWidth: 0,
  },
  bannerNoImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  viewEditButton: {
    position: "absolute",
    zIndex: 3600,
  },
  bannerContent: {
    alignItems: "center",
  },
  bannerNoImageIcon: {
    width: 64,
    height: 64,
  },
  bannerPrompt: {
    width: 200,
    marginTop: 8,
    paddingHorizontal: 32,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
    zIndex: 1,
  },
  scrollMapExpanded: {
    overflow: "visible",
  },
  hidden: {
    opacity: 0,
  },
  card: {
    marginTop: -CARD_BORDER_RADIUS,
    overflow: "visible",
  },
  profileImage: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 2,
  },
  cardInner: {
    borderTopLeftRadius: CARD_BORDER_RADIUS,
    borderTopRightRadius: CARD_BORDER_RADIUS,
    paddingHorizontal: SCROLL_HORIZONTAL_PADDING,
  },
  viewTitle: {
    alignSelf: "stretch",
  },
  fields: {
    alignItems: "flex-start",
    gap: 20,
  },
  dateGroup: {
    alignItems: "flex-start",
    gap: 8,
  },
  dateRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "flex-start",
    gap: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  section: {
    alignSelf: "stretch",
    gap: 12,
  },
  sectionEnd: {
    height: 1,
  },
  addBlockRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 12,
  },
  deleteRow: {
    alignSelf: "stretch",
    alignItems: "flex-end",
    marginTop: 12,
  },
});
