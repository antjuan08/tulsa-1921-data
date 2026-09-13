import { colors, radius, spacing, typography } from './index';

const pxOrValue = (v: number | string) => (typeof v === 'number' ? `${v}px` : v);

const mapNumberRecord = <T extends Record<string, number>>(rec: T): Record<keyof T, string> =>
  Object.fromEntries(Object.entries(rec).map(([k, v]) => [k, pxOrValue(v)])) as Record<
    keyof T,
    string
  >;

// Tailwind v4 uses CSS-first config, but we still export a JS preset that
// individual apps can import in their own tailwind.config or @theme block.
export const tailwindPreset = {
  theme: {
    extend: {
      colors: {
        bg: colors.background,
        fg: colors.foreground,
        border: colors.border,
        accent: colors.accent,
        danger: colors.danger,
        success: colors.success,
      },
      borderRadius: mapNumberRecord(radius),
      spacing: mapNumberRecord(spacing),
      fontFamily: typography.fontFamily,
      fontSize: mapNumberRecord(typography.fontSize),
      lineHeight: typography.lineHeight,
    },
  },
} as const;

export default tailwindPreset;
