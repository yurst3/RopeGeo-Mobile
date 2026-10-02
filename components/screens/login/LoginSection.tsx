import { ConstantText } from "@/components/text/ConstantText";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { useResolvedIconSizeScale } from "@/utils/theme/resolvers";
import { Image } from "expo-image";
import type { ImageSourcePropType } from "react-native";
import { Pressable, StyleSheet, View } from "react-native";

const APPLE_LOGO = require("@/assets/images/icons/buttons/appleLogo.png");
const GOOGLE_LOGO = require("@/assets/images/icons/buttons/googleLogo.png");
const FACEBOOK_LOGO = require("@/assets/images/icons/buttons/facebookLogo.png");
const ROPEGEO_LOGO = require("@/assets/images/logo.png");
const WARNING_ICON = require("@/assets/images/temp/warning.png");

const DESIGN_LOGO_SIZE = 22;
const DESIGN_WARNING_ICON_SIZE = 18;
const DESIGN_BRAND_LOGO_SIZE = 88;
const BRAND_LOGO_BORDER_RADIUS = 20;
const BRAND_LOGO_GAP = 16;
const BUTTON_PADDING_VERTICAL = 12;
const BUTTON_PADDING_HORIZONTAL = 16;
const BUTTON_BORDER_RADIUS = 12;
const BUTTON_GAP = 10;
const LOGO_LABEL_GAP = 10;

type LoginProvider = "apple" | "google" | "facebook" | "email" | "createAccount";

type LoginOption = {
  provider: LoginProvider;
  label: string;
  logo?: ImageSourcePropType;
  /** When set, applies Image tint (Apple logo only). */
  tintLogo?: boolean;
};

const LOGIN_OPTIONS: LoginOption[] = [
  {
    provider: "apple",
    label: "Log in with Apple",
    logo: APPLE_LOGO,
    tintLogo: true,
  },
  {
    provider: "google",
    label: "Log in with Google",
    logo: GOOGLE_LOGO,
  },
  {
    provider: "facebook",
    label: "Log in with Facebook",
    logo: FACEBOOK_LOGO,
  },
  {
    provider: "email",
    label: "Log in with email",
  },
  {
    provider: "createAccount",
    label: "Create an account",
  },
];

/** Demo login affordances. Provider buttons call {@link onContinue}. */
export function LoginSection({ onContinue }: { onContinue: () => void }) {
  const { text, cardHighlight, filter } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const iconSizeScale = useResolvedIconSizeScale();
  const logoSize = Math.round(DESIGN_LOGO_SIZE * iconSizeScale);
  const warningIconSize = Math.round(DESIGN_WARNING_ICON_SIZE * iconSizeScale);
  const brandLogoSize = Math.round(DESIGN_BRAND_LOGO_SIZE * iconSizeScale);
  const brandLogoRadius = Math.round(BRAND_LOGO_BORDER_RADIUS * iconSizeScale);
  /** Apple logo should read as the opposite of the page background. */
  const appleTint = text.primary;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View
          style={[
            styles.brandLogoWrap,
            {
              width: brandLogoSize,
              height: brandLogoSize,
              borderRadius: brandLogoRadius,
              marginBottom: Math.round(BRAND_LOGO_GAP * iconSizeScale),
            },
          ]}
        >
          <Image
            source={ROPEGEO_LOGO}
            style={{ width: brandLogoSize, height: brandLogoSize }}
            contentFit="cover"
            accessibilityLabel="RopeGeo"
          />
        </View>
        <ConstantText
          size={uiScale.pageScreen.text.title}
          typography={textStyle.pageScreen.title}
          style={[styles.headline, { color: text.primary }]}
        >
          Log in or sign up
        </ConstantText>
      </View>

      <View style={styles.buttonsHost}>
        <View style={styles.buttons}>
          {LOGIN_OPTIONS.map((option) => (
            <Pressable
              key={option.provider}
              onPress={onContinue}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: cardHighlight,
                  borderColor: filter.checkbox.uncheckedOutline,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={option.label}
            >
              <View style={styles.buttonContent}>
                {option.logo != null ? (
                  <Image
                    source={option.logo}
                    style={{
                      width: logoSize,
                      height: logoSize,
                      ...(option.tintLogo ? { tintColor: appleTint } : null),
                    }}
                    contentFit="contain"
                  />
                ) : null}
                <ConstantText
                  size={uiScale.filter.buttons.chip.text!}
                  typography={textStyle.filter.optionLabel}
                  style={{ color: text.primary }}
                >
                  {option.label}
                </ConstantText>
                <Image
                  source={WARNING_ICON}
                  style={{ width: warningIconSize, height: warningIconSize }}
                  contentFit="contain"
                  accessibilityLabel="Not implemented"
                />
              </View>
            </Pressable>
          ))}
          <Pressable
            onPress={() => {}}
            style={({ pressed }) => [
              styles.forgotPassword,
              pressed && styles.forgotPasswordPressed,
            ]}
            accessibilityRole="link"
            accessibilityLabel="Forgot password?"
          >
            <ConstantText
              size={uiScale.filter.buttons.chip.text!}
              typography={textStyle.filter.optionLabel}
              style={[styles.forgotPasswordText, { color: text.link }]}
            >
              Forgot password?
            </ConstantText>
            <Image
              source={WARNING_ICON}
              style={{ width: warningIconSize, height: warningIconSize }}
              contentFit="contain"
              accessibilityLabel="Not implemented"
            />
          </Pressable>
        </View>
      </View>

      <ConstantText
        size={uiScale.betaSection.text.body}
        typography={textStyle.betaSection.body}
        style={[styles.intro, { color: text.secondary }]}
      >
        Create an account or log in to interact with other users, leave route
        reports, or create new trips.
      </ConstantText>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    flex: 1,
    width: "100%",
  },
  header: {
    width: "100%",
    alignItems: "center",
  },
  buttonsHost: {
    flex: 1,
    justifyContent: "center",
  },
  buttons: {
    gap: BUTTON_GAP,
    width: "100%",
  },
  brandLogoWrap: {
    overflow: "hidden",
    alignSelf: "center",
  },
  headline: {
    textAlign: "center",
    width: "100%",
  },
  intro: {},
  button: {
    width: "100%",
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingVertical: BUTTON_PADDING_VERTICAL,
    paddingHorizontal: BUTTON_PADDING_HORIZONTAL,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: LOGO_LABEL_GAP,
  },
  forgotPassword: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: LOGO_LABEL_GAP,
    paddingVertical: 4,
  },
  forgotPasswordPressed: {
    opacity: 0.7,
  },
  forgotPasswordText: {
    textDecorationLine: "underline",
  },
});
