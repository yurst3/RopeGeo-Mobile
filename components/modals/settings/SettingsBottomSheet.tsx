import { ConstantText } from "@/components/text/ConstantText";
import { FontSettingsSection } from "@/components/modals/settings/FontSettingsSection";
import { RelevantInfoSettingsSection } from "@/components/modals/settings/RelevantInfoSettingsSection";
import { ThemeSettingsSection } from "@/components/modals/settings/ThemeSettingsSection";
import { UiScaleSettingsSection } from "@/components/modals/settings/UiScaleSettingsSection";
import { UnitsSettingsSection } from "@/components/modals/settings/UnitsSettingsSection";
import { useSettings } from "@/context/app/SettingsContext";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { FILTER_SHEET_HORIZONTAL_INSET } from "@/utils/filters/filterSheetInsets";
import { useFilterTheme } from "@/utils/filters/useFilterTheme";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type WithSpringConfig,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SHEET_MAX_HEIGHT_RATIO = 0.88;
const SHEET_TOP_RESERVE = 84;
const SHEET_FOOTER_RESERVE_EMPTY = 28;

const SHEET_SPRING: WithSpringConfig = {
  damping: 32,
  stiffness: 320,
  overshootClamping: true,
};

type SettingsBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function SettingsBottomSheet({
  visible,
  onClose,
}: SettingsBottomSheetProps) {
  const { background, text, placeholder } = useColorTheme();
  const { sectionLabel } = useFilterTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const insets = useSafeAreaInsets();
  const windowHeight = Dimensions.get("window").height;
  const dismissOffset = windowHeight;
  const translateY = useSharedValue(dismissOffset);
  const overlayOpacity = useSharedValue(0);
  const isClosingRef = useRef(false);
  const {
    settings,
    setTheme,
    setFont,
    setUiScale,
    setUnits,
    setShowRelevantContext,
    setShowRelevantContextStrengths,
  } = useSettings();

  const dismissSheet = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }
    isClosingRef.current = true;
    overlayOpacity.value = withTiming(0, { duration: 180 });
    translateY.value = withSpring(dismissOffset, SHEET_SPRING, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  }, [dismissOffset, onClose, overlayOpacity, translateY]);

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      translateY.value = dismissOffset;
      overlayOpacity.value = 0;
      overlayOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, SHEET_SPRING);
    } else {
      translateY.value = dismissOffset;
      overlayOpacity.value = 0;
    }
  }, [dismissOffset, overlayOpacity, translateY, visible]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          if (e.translationY > 0) {
            translateY.value = e.translationY;
            overlayOpacity.value = Math.max(0, 1 - e.translationY / 200);
          }
        })
        .onEnd((e) => {
          if (e.translationY > 80 || e.velocityY > 800) {
            runOnJS(dismissSheet)();
          } else {
            overlayOpacity.value = withTiming(1, { duration: 150 });
            translateY.value = withSpring(0, SHEET_SPRING);
          }
        }),
    [dismissSheet, overlayOpacity, translateY],
  );

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const maxH = useMemo(
    () => Math.round(windowHeight * SHEET_MAX_HEIGHT_RATIO),
    [windowHeight],
  );

  const scrollAreaMaxHeight = Math.max(
    220,
    maxH - SHEET_TOP_RESERVE - SHEET_FOOTER_RESERVE_EMPTY,
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismissSheet}
    >
      <View style={styles.overlayContainer}>
        <Animated.View style={[styles.overlay, overlayStyle]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={dismissSheet} />
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: background,
              paddingBottom: Math.max(insets.bottom, 12),
              maxHeight: maxH,
            },
            sheetStyle,
          ]}
        >
          <GestureDetector gesture={pan}>
            <View style={styles.grabArea}>
              <View style={[styles.grabPill, { backgroundColor: placeholder }]} />
              <ConstantText
                size={uiScale.filter.text.title}
                typography={textStyle.filter.title}
                style={[styles.sheetTitle, { color: text.primary }]}
              >
                Settings
              </ConstantText>
            </View>
          </GestureDetector>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollPad}
            style={{ maxHeight: scrollAreaMaxHeight }}
            showsVerticalScrollIndicator
          >
            <ConstantText
              size={uiScale.filter.text.sectionTitle}
              typography={textStyle.filter.sectionTitle}
              style={[styles.sectionLabel, sectionLabel, styles.firstSectionLabel]}
            >
              Theme
            </ConstantText>
            <ThemeSettingsSection value={settings.theme} onChange={setTheme} />

            <ConstantText
              size={uiScale.filter.text.sectionTitle}
              typography={textStyle.filter.sectionTitle}
              style={[styles.sectionLabel, sectionLabel]}
            >
              Font
            </ConstantText>
            <FontSettingsSection value={settings.font} onChange={setFont} />

            <ConstantText
              size={uiScale.filter.text.sectionTitle}
              typography={textStyle.filter.sectionTitle}
              style={[styles.sectionLabel, sectionLabel]}
            >
              UI Scale
            </ConstantText>
            <UiScaleSettingsSection
              value={settings.uiScale}
              onChange={setUiScale}
            />

            <ConstantText
              size={uiScale.filter.text.sectionTitle}
              typography={textStyle.filter.sectionTitle}
              style={[styles.sectionLabel, sectionLabel]}
            >
              Units
            </ConstantText>
            <UnitsSettingsSection
              value={settings.lengthMeasurementSystem}
              onChange={setUnits}
            />

            <RelevantInfoSettingsSection
              showRelevantContext={settings.showRelevantContext}
              strengthMin={settings.showRelevantContextStrengths.min}
              strengthMax={settings.showRelevantContextStrengths.max}
              onShowRelevantContextChange={setShowRelevantContext}
              onStrengthsChange={setShowRelevantContextStrengths}
              onBeforeOpenInfo={dismissSheet}
            />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
  },
  grabArea: {
    alignItems: "center",
    paddingBottom: 8,
    paddingHorizontal: FILTER_SHEET_HORIZONTAL_INSET,
  },
  grabPill: {
    width: 40,
    height: 5,
    borderRadius: 3,
    marginBottom: 12,
  },
  sheetTitle: {
    alignSelf: "flex-start",
  },
  scrollPad: {
    paddingBottom: 16,
    paddingHorizontal: FILTER_SHEET_HORIZONTAL_INSET,
  },
  sectionLabel: {
    marginTop: 16,
    marginBottom: 8,
  },
  firstSectionLabel: {
    marginTop: 0,
  },
});
