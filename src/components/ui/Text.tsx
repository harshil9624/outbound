import { createContext, useContext, type ReactNode } from 'react';
import { Text as RNText, StyleSheet, type TextProps } from 'react-native';
import { MAX_FONT_SCALE, colors, fontFamilyFor } from '@/theme';

/**
 * True inside a colour face (a yellow button, a pink card...). Dark mode turns ink light, but a
 * colour face keeps dark text, so Text swaps ink for onColor here. Neutral faces reset it to false.
 */
const OnColorContext = createContext(false);

export function OnColor({ value = true, children }: { value?: boolean; children: ReactNode }) {
  return <OnColorContext.Provider value={value}>{children}</OnColorContext.Provider>;
}

/** Ink for glyphs and strokes at this spot: onColor inside a colour face, ink elsewhere. */
export function useInk(): string {
  return useContext(OnColorContext) ? colors.onColor : colors.ink;
}

/**
 * Drop-in for React Native's Text. Ink text follows the face it sits on, and the weight a style
 * asks for becomes the matching font file (see fontFamilyFor).
 */
export function Text({ style, maxFontSizeMultiplier = MAX_FONT_SCALE, ...rest }: TextProps) {
  const onColor = useContext(OnColorContext);
  const flat = StyleSheet.flatten(style) ?? {};
  let swap: string | undefined;
  if (flat.color === undefined) swap = onColor ? colors.onColor : colors.ink;
  else if (onColor && flat.color === colors.ink) swap = colors.onColor;
  else if (onColor && flat.color === colors.inkMuted) swap = colors.onColorMuted;
  // fontWeight 'normal': the family already carries the weight, and Android would fake-bold it again.
  const font = { fontFamily: flat.fontFamily ?? fontFamilyFor(flat.fontWeight, flat.fontSize), fontWeight: 'normal' as const };
  return <RNText style={[style, font, swap ? { color: swap } : null]} maxFontSizeMultiplier={maxFontSizeMultiplier} {...rest} />;
}
