import { ConstantText } from "@/components/text/ConstantText";
import { AttributionAuthorsText } from "@/components/attribution/AttributionAuthorsText";
import {
  ROPEWIKI_ATTRIBUTION_LICENSE_PREFIX,
  ROPEWIKI_CC_LICENSE_SHORT_NAME,
  ROPEWIKI_CC_LICENSE_URI,
} from "@/constants/ropewikiAttribution";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";

export type RopewikiPageAttributionFooterProps = {
  authors: string[] | null | undefined;
};

/**
 * Page authors and CC BY-NC-SA 3.0 license notice at the bottom of a Ropewiki page card.
 */
export function RopewikiPageAttributionFooter({
  authors,
}: RopewikiPageAttributionFooterProps) {
  const { text } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();

  const openLicense = useCallback(async () => {
    try {
      await WebBrowser.openBrowserAsync(ROPEWIKI_CC_LICENSE_URI);
    } catch {
      // Ignore cancel / open failures
    }
  }, []);

  const metaSize = uiScale.pageScreen.text.metaData;
  const metaTypography = textStyle.pageScreen.metaData;
  const metaColor = { color: text.secondary };

  return (
    <View style={styles.wrap}>
      <AttributionAuthorsText
        authors={authors}
        textAlign="left"
        style={styles.pageAuthors}
      />
      <ConstantText
        size={metaSize}
        typography={metaTypography}
        style={[styles.license, metaColor]}
      >
        {ROPEWIKI_ATTRIBUTION_LICENSE_PREFIX}
        <ConstantText
          size={metaSize}
          typography={metaTypography}
          style={[styles.licenseLink, { color: text.link }]}
          onPress={openLicense}
        >
          {ROPEWIKI_CC_LICENSE_SHORT_NAME}
        </ConstantText>
      </ConstantText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 24,
  },
  pageAuthors: {
    marginBottom: 8,
  },
  license: {},
  licenseLink: {
    textDecorationLine: "underline",
  },
});
