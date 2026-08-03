import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MIN_TOUCH_TARGET, colors, radii, spacing, typography } from '@circulo/config';

/**
 * The design system, implemented once. Screens compose these; they do not
 * introduce colours, spacing values or radii of their own.
 */

export function useTheme() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, c: colors[scheme] } as const;
}

export function Screen({
  children,
  scroll = true,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}) {
  const { c } = useTheme();
  const content = (
    <View style={[{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }, style]}>{children}</View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top', 'bottom']}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
          style={{ flex: 1 }}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  return (
    <Text accessibilityRole="header" style={[typography.display, { color: c.text }]}>
      {children}
    </Text>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  return (
    <Text accessibilityRole="header" style={[typography.title, { color: c.text }]}>
      {children}
    </Text>
  );
}

export function Body({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  const { c } = useTheme();
  return <Text style={[typography.body, { color: muted ? c.textMuted : c.text }]}>{children}</Text>;
}

export function Caption({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  return <Text style={[typography.caption, { color: c.textMuted }]}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { c } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: c.surface,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: c.border,
          padding: spacing.md,
          gap: spacing.sm,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
}) {
  const { c } = useTheme();
  const palette = {
    primary: { bg: c.primary, fg: c.primaryText, border: c.primary },
    secondary: { bg: 'transparent', fg: c.text, border: c.border },
    quiet: { bg: 'transparent', fg: c.textMuted, border: 'transparent' },
    danger: { bg: 'transparent', fg: c.danger, border: c.danger },
  }[variant];

  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: MIN_TOUCH_TARGET,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.bg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <Text style={[typography.subtitle, { color: palette.fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const { c } = useTheme();
  const content = (
    <Text style={[typography.caption, { color: selected ? c.primaryText : c.text }]}>{label}</Text>
  );
  const style: ViewStyle = {
    minHeight: onPress ? MIN_TOUCH_TARGET : undefined,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: selected ? c.primary : c.border,
    backgroundColor: selected ? c.primary : c.surfaceMuted,
  };

  if (!onPress) return <View style={style}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={style}
    >
      {content}
    </Pressable>
  );
}

export function Field({
  label,
  error,
  hint,
  ...props
}: TextInputProps & { label: string; error?: string; hint?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[typography.caption, { color: c.textMuted }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={hint}
        placeholderTextColor={c.textMuted}
        style={[
          typography.body,
          {
            minHeight: MIN_TOUCH_TARGET,
            color: c.text,
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: error ? c.danger : c.border,
            borderRadius: radii.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          },
        ]}
        {...props}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[typography.caption, { color: c.danger }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[typography.caption, { color: c.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function Loading({ label = 'Cargando' }: { label?: string }) {
  const { c } = useTheme();
  return (
    <View style={styles.centered} accessibilityLabel={label} accessibilityRole="progressbar">
      <ActivityIndicator color={c.primary} />
      <Caption>{label}</Caption>
    </View>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.centered}>
      <Heading>{title}</Heading>
      <Body muted>{body}</Body>
      {action ? <Button label={action.label} onPress={action.onPress} variant="secondary" /> : null}
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.centered} accessibilityLiveRegion="polite">
      <Heading>No pudimos cargar esto</Heading>
      <Body muted>{message}</Body>
      {onRetry ? <Button label="Reintentar" onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

export function Divider() {
  const { c } = useTheme();
  return <View style={{ height: 1, backgroundColor: c.border }} />;
}

export function Row({ children, gap = spacing.sm }: { children: ReactNode; gap?: number }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>{children}</View>;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
});
