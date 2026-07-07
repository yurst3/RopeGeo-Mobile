import { ConstantText } from "@/components/text/ConstantText";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import type { ReactNode } from "react";
import type { StyleProp, TextStyle } from "react-native";

export function InfoScreenTitle({ children }: { children: string }) {
  const uiScale = useUiScale();
  const style = useTextStyle();
  const { text } = useColorTheme();

  return (
    <ConstantText
      size={uiScale.infoScreen.text.title}
      typography={style.infoScreen.title}
      style={{ color: text.primary }}
    >
      {children}
    </ConstantText>
  );
}

export function InfoScreenSubtitle({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const uiScale = useUiScale();
  const typographyStyle = useTextStyle();
  const { text } = useColorTheme();

  return (
    <ConstantText
      size={uiScale.infoScreen.text.description}
      typography={typographyStyle.infoScreen.description}
      style={[{ color: text.secondary }, style]}
    >
      {children}
    </ConstantText>
  );
}

export function InfoScreenBody({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const uiScale = useUiScale();
  const typographyStyle = useTextStyle();
  const { text } = useColorTheme();

  return (
    <ConstantText
      size={uiScale.infoScreen.text.badgeDescription}
      typography={typographyStyle.infoScreen.badgeDescription}
      style={[{ color: text.secondary }, style]}
    >
      {children}
    </ConstantText>
  );
}

export function InfoScreenSectionHeader({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const uiScale = useUiScale();
  const typographyStyle = useTextStyle();
  const { text } = useColorTheme();

  return (
    <ConstantText
      size={uiScale.infoScreen.text.badgeDescriptionHeader}
      typography={typographyStyle.infoScreen.badgeDescriptionHeader}
      style={[{ color: text.primary }, style]}
    >
      {children}
    </ConstantText>
  );
}
