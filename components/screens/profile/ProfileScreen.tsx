import { EditButton } from "@/components/buttons/standard/EditButton";
import { LogoutButton } from "@/components/buttons/nonstandard/LogoutButton";
import { SettingsBottomSheet } from "@/components/modals/settings/SettingsBottomSheet";
import { SettingsButton } from "@/components/buttons/standard/SettingsButton";
import { ConstantText } from "@/components/text/ConstantText";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useHeaderChromeLayout } from "@/utils/layout/buttonChromeLayout";
import {
  useResolvedConstantSize,
  useResolvedIconSizeScale,
  useResolvedTypography,
} from "@/utils/theme/resolvers";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput, View, Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PROFILE_PIC = require("@/assets/images/temp/profilePic.png");
const EDIT_PROFILE_PIC_ICON = require("@/assets/images/icons/buttons/editProfilePic.png");
const WARNING_ICON = require("@/assets/images/temp/warning.png");
const EDIT_ICON = require("@/assets/images/icons/buttons/edit.png");
const DESIGN_AVATAR_SIZE = 160;
const DESIGN_AVATAR_BORDER_WIDTH = 3;
const DESIGN_EDIT_OVERLAY_ICON_SIZE = 56;
const DESIGN_WARNING_ICON_SIZE = 18;
const DESIGN_DISPLAY_NAME_ICON_SIZE = 24;
const DISPLAY_NAME_ICON_GAP = 4;

const PRONOUN_OPTIONS = ["He/Him", "She/Her", "They/Them"] as const;
type Pronouns = (typeof PRONOUN_OPTIONS)[number];

const PROFILE_TABS = ["Activity", "Badges", "Certificates"] as const;
type ProfileTab = (typeof PROFILE_TABS)[number];
const DESIGN_TAB_WARNING_ICON_SIZE = 36;

export function ProfileScreen() {
  const { background, text, image, filter, separator, toast, button } = useColorTheme();
  const highlightColor = button.standard.edit.iconHighlight ?? text.link;
  const textStyle = useTextStyle();
  const uiScale = useUiScale();
  const insets = useSafeAreaInsets();
  const headerChrome = useHeaderChromeLayout();
  const iconSizeScale = useResolvedIconSizeScale();
  const router = useRouter();
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  // Temporary local display name. This will be loaded from and saved to the
  // backend through the API once profile persistence exists.
  const [displayName, setDisplayName] = useState("Ethan Hurst");
  const [displayNameDraft, setDisplayNameDraft] = useState(displayName);
  // Temporary local pronouns. This will be loaded from and saved to the
  // backend through the API once profile persistence exists.
  const [pronouns, setPronouns] = useState<Pronouns>("He/Him");
  const [pronounsOpen, setPronounsOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<ProfileTab>("Activity");
  const avatarSize = Math.round(DESIGN_AVATAR_SIZE * iconSizeScale);
  const avatarBorderWidth = Math.max(
    2,
    Math.round(DESIGN_AVATAR_BORDER_WIDTH * iconSizeScale),
  );
  const editOverlayIconSize = Math.round(
    DESIGN_EDIT_OVERLAY_ICON_SIZE * iconSizeScale,
  );
  const warningIconSize = Math.round(DESIGN_WARNING_ICON_SIZE * iconSizeScale);
  const tabWarningIconSize = Math.round(DESIGN_TAB_WARNING_ICON_SIZE * iconSizeScale);
  const displayNameIconSize = Math.round(DESIGN_DISPLAY_NAME_ICON_SIZE * iconSizeScale);
  const [hintTextWidth, setHintTextWidth] = useState(0);
  const [draftTextWidth, setDraftTextWidth] = useState(0);
  const displayNameSize = useResolvedConstantSize(uiScale.pageScreen.text.title);
  const displayNameHintSize = useResolvedConstantSize(uiScale.filter.text.sectionTitle);
  const displayNameTypography = useResolvedTypography(textStyle.pageScreen.title);
  const displayNameDraftIsEmpty = displayNameDraft.trim().length === 0;
  const displayNameTextSlotWidth =
    hintTextWidth > 0 ? hintTextWidth : Math.ceil(displayNameHintSize * 12);
  const displayNameFieldWidth =
    displayNameTextSlotWidth +
    displayNameIconSize +
    DISPLAY_NAME_ICON_GAP +
    24;
  const displayNameFieldHeight = Math.max(displayNameSize, displayNameIconSize) + 16;
  const displayNameOverflows = draftTextWidth > displayNameTextSlotWidth;
  const headerTop = insets.top + headerChrome.rowTopInset;

  const commitDisplayName = () => {
    const next = displayNameDraft.trim();
    if (next.length === 0) {
      setDisplayNameDraft(displayName);
      return;
    }
    setDisplayName(next);
    setDisplayNameDraft(next);
  };

  const toggleEditing = () => {
    if (editing) {
      commitDisplayName();
      setPronounsOpen(false);
      setEditing(false);
      return;
    }
    setDisplayNameDraft(displayName);
    setEditing(true);
  };

  return (
    <View style={[styles.screen, { backgroundColor: background }]}>
      <ConstantText
        size={uiScale.filter.text.sectionTitle}
        typography={textStyle.pageScreen.title}
        onLayout={(event) => {
          const next = Math.ceil(event.nativeEvent.layout.width);
          setHintTextWidth((current) => (current === next ? current : next));
        }}
        style={styles.displayNameMeasure}
        pointerEvents="none"
      >
        Enter a display name
      </ConstantText>
      <ConstantText
        size={uiScale.pageScreen.text.title}
        typography={textStyle.pageScreen.title}
        onLayout={(event) => {
          const next = Math.ceil(event.nativeEvent.layout.width);
          setDraftTextWidth((current) => (current === next ? current : next));
        }}
        style={styles.displayNameMeasure}
        pointerEvents="none"
      >
        {displayNameDraft.length > 0 ? displayNameDraft : " "}
      </ConstantText>
      <View
        style={[
          styles.logoutButton,
          {
            top: headerTop,
            left: insets.left + headerChrome.edgeInset,
            height: headerChrome.buttonSize,
          },
        ]}
      >
        <LogoutButton onPress={() => router.back()} />
      </View>

      <View
        style={[
          styles.headerActions,
          {
            top: headerTop,
            right: insets.right + headerChrome.edgeInset,
            gap: headerChrome.gap,
          },
        ]}
      >
        <EditButton editing={editing} onPress={toggleEditing} />
        <SettingsButton onPress={() => setSettingsSheetOpen(true)} />
      </View>

      <View
        style={[
          styles.profileColumn,
          { top: headerTop + headerChrome.buttonSize },
        ]}
      >
        <View style={styles.profileHeader}>
        <View
          style={[
            styles.avatar,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              borderWidth: avatarBorderWidth,
              borderColor: text.primary,
            },
          ]}
        >
          <Image
            source={PROFILE_PIC}
            style={{
              width: avatarSize - avatarBorderWidth * 2,
              height: avatarSize - avatarBorderWidth * 2,
            }}
            contentFit="cover"
            accessibilityLabel="Profile picture"
          />
          {editing ? (
            <View style={styles.editOverlay} pointerEvents="none">
              <View
                style={[styles.editScrim, { backgroundColor: image.profileEditScrim }]}
              />
              <Image
                source={EDIT_PROFILE_PIC_ICON}
                style={{
                  width: editOverlayIconSize,
                  height: editOverlayIconSize,
                  tintColor: image.profileEditIcon,
                }}
                contentFit="contain"
                accessibilityLabel="Edit profile picture"
              />
              <View
                style={[
                  styles.warningIcon,
                  { marginBottom: editOverlayIconSize / 2 + 6 },
                ]}
              >
                <Image
                  source={WARNING_ICON}
                  style={{ width: warningIconSize, height: warningIconSize }}
                  contentFit="contain"
                  accessibilityLabel="Not implemented"
                />
              </View>
            </View>
          ) : null}
        </View>
        <View style={styles.displayName}>
          {editing ? (
            <View
              style={[
                styles.displayNameInput,
                {
                  width: displayNameFieldWidth,
                  height: displayNameFieldHeight,
                  backgroundColor: displayNameDraftIsEmpty
                    ? image.profileDisplayNameErrorBackground
                    : image.profileDisplayNameBackground,
                  borderColor: displayNameDraftIsEmpty
                    ? image.profileDisplayNameErrorOutline
                    : image.profileDisplayNameOutline,
                },
              ]}
            >
              <TextInput
                value={displayNameDraft}
                onChangeText={setDisplayNameDraft}
                onBlur={commitDisplayName}
                placeholder="Enter a display name"
                placeholderTextColor={
                  displayNameDraftIsEmpty ? text.error : text.tertiary
                }
                autoCapitalize="words"
                autoCorrect={false}
                allowFontScaling={false}
                numberOfLines={1}
                scrollEnabled
                selection={
                  displayNameOverflows
                    ? { start: displayNameDraft.length, end: displayNameDraft.length }
                    : undefined
                }
                style={[
                  displayNameTypography,
                  styles.displayNameField,
                  {
                    width: displayNameTextSlotWidth,
                    fontSize: displayNameDraftIsEmpty ? displayNameHintSize : displayNameSize,
                    color: text.primary,
                    textAlign: displayNameOverflows ? "left" : "center",
                  },
                ]}
                accessibilityLabel="Display name"
              />
              <Image
                source={EDIT_ICON}
                style={{
                  width: displayNameIconSize,
                  height: displayNameIconSize,
                  tintColor: displayNameDraftIsEmpty
                    ? image.profileDisplayNameErrorOutline
                    : text.primary,
                }}
                contentFit="contain"
                accessibilityLabel="Edit display name"
              />
            </View>
          ) : (
            <ConstantText
              size={uiScale.pageScreen.text.title}
              typography={textStyle.pageScreen.title}
              style={[styles.displayNameText, { color: text.primary }]}
            >
              {displayName}
            </ConstantText>
          )}
        </View>
        <View style={styles.pronouns}>
          {editing ? (
            <Pressable
              style={[
                styles.pronounsTrigger,
                { borderColor: filter.dropdown.outline },
              ]}
              onPress={() => setPronounsOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Pronouns"
            >
              <ConstantText
                size={uiScale.filter.text.sectionTitle}
                typography={textStyle.filter.optionLabel}
                style={{ color: text.primary }}
              >
                {pronouns}
              </ConstantText>
              <ConstantText
                size={uiScale.filter.buttons.radio.subtext!}
                typography={textStyle.filter.optionSublabel}
                style={{ color: text.secondary }}
              >
                ▼
              </ConstantText>
            </Pressable>
          ) : (
            <ConstantText
              size={uiScale.filter.text.sectionTitle}
              typography={textStyle.filter.optionLabel}
              style={{ color: text.secondary }}
            >
              {pronouns}
            </ConstantText>
          )}
        </View>
        </View>
        <View style={[styles.tabs, { borderBottomColor: separator }]}>
          {PROFILE_TABS.map((tab) => {
            const selected = tab === profileTab;
            return (
              <Pressable
                key={tab}
                style={styles.tab}
                onPress={() => setProfileTab(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
              >
                <ConstantText
                  size={uiScale.filter.text.sectionTitle}
                  typography={
                    selected ? textStyle.pageScreen.title : textStyle.filter.optionLabel
                  }
                  style={{ color: selected ? highlightColor : text.secondary }}
                >
                  {tab}
                </ConstantText>
                <View
                  style={[
                    styles.tabIndicator,
                    { backgroundColor: selected ? highlightColor : "transparent" },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
        <View style={styles.tabBody}>
          <Image
            source={WARNING_ICON}
            style={{ width: tabWarningIconSize, height: tabWarningIconSize }}
            contentFit="contain"
            accessibilityLabel="Not implemented"
          />
          <ConstantText
            size={uiScale.filter.text.sectionTitle}
            typography={textStyle.filter.optionLabel}
            style={{ color: toast.warning.text }}
          >
            Not Implemented
          </ConstantText>
        </View>
      </View>

      <Modal
        visible={pronounsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPronounsOpen(false)}
      >
        <View style={styles.pronounsBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPronounsOpen(false)}
          />
          <View
            style={[
              styles.pronounsCard,
              { backgroundColor: filter.dropdown.modalBackground },
            ]}
          >
            {PRONOUN_OPTIONS.map((option) => (
              <Pressable
                key={option}
                style={styles.pronounsOption}
                onPress={() => {
                  setPronouns(option);
                  setPronounsOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: option === pronouns }}
              >
                <ConstantText
                  size={uiScale.filter.text.sectionTitle}
                  typography={textStyle.filter.optionLabel}
                  style={{ color: option === pronouns ? text.link : text.primary }}
                >
                  {option}
                </ConstantText>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      <SettingsBottomSheet
        visible={settingsSheetOpen}
        onClose={() => setSettingsSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  logoutButton: {
    position: "absolute",
    zIndex: 1,
    justifyContent: "center",
  },
  headerActions: {
    position: "absolute",
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  profileColumn: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  profileHeader: {
    alignItems: "center",
  },
  tabs: {
    flexDirection: "row",
    marginTop: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 10,
  },
  tabIndicator: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
    height: 2,
    borderRadius: 1,
  },
  tabBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  avatar: {
    overflow: "hidden",
  },
  displayName: {
    marginTop: 12,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  displayNameText: {
    textAlign: "center",
  },
  pronouns: {
    marginTop: 8,
    alignItems: "center",
  },
  pronounsTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  pronounsBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  pronounsCard: {
    borderRadius: 14,
    overflow: "hidden",
  },
  pronounsOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  displayNameInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: DISPLAY_NAME_ICON_GAP,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  displayNameField: {
    padding: 0,
    margin: 0,
  },
  displayNameMeasure: {
    position: "absolute",
    opacity: 0,
  },
  editOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  editScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  warningIcon: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "50%",
    alignItems: "center",
  },
});
