import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { ImageBackground, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenShellProps = {
  badgeLabel?: string;
  children: ReactNode;
  homeHref?: Href;
  pageBackgroundUri?: string;
};

export function ScreenShell({ badgeLabel = 'Live', children, homeHref, pageBackgroundUri }: ScreenShellProps) {
  const shellBody = (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brand}>Vaanika</Text>
            <Text style={styles.tagline}>Your AI language tutor, anytime.</Text>
          </View>
          {homeHref ? (
            <Link href={homeHref} asChild>
              <Pressable style={styles.headerButton}>
                <Text style={styles.headerButtonText}>Home</Text>
              </Pressable>
            </Link>
          ) : (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          )}
        </View>
        {children}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {Platform.OS === 'web' && pageBackgroundUri ? (
        <ImageBackground
          source={{ uri: pageBackgroundUri }}
          style={styles.pageBackground}
          imageStyle={styles.pageBackgroundImage}
        >
          <View style={styles.pageBackgroundOverlay} />
          {shellBody}
        </ImageBackground>
      ) : (
        shellBody
      )}
    </SafeAreaView>
  );
}

export function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.secondaryButton, disabled && styles.secondaryButtonDisabled]}
    >
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  pageBackground: {
    flex: 1,
  },
  pageBackgroundImage: {
    opacity: 0.55,
  },
  pageBackgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(230, 238, 245, 0.62)',
  },
  page: {
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },
  content: {
    gap: 18,
    maxWidth: 1040,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brandBlock: {
    flex: 1,
    paddingRight: 10,
  },
  brand: {
    color: '#122025',
    fontSize: Platform.OS === 'web' ? 52 : 34,
    fontWeight: '800',
  },
  tagline: {
    color: '#4f6069',
    fontSize: Platform.OS === 'web' ? 16 : 14,
    marginTop: Platform.OS === 'web' ? 4 : 2,
  },
  badge: {
    backgroundColor: '#e8f3de',
    borderRadius: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#355c2f',
    fontSize: 12,
    fontWeight: '800',
  },
  headerButton: {
    backgroundColor: '#ffffff',
    borderColor: '#d8dde3',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerButtonText: {
    color: '#1f2d34',
    fontSize: 12,
    fontWeight: '800',
  },
  hero: {
    backgroundColor: '#113038',
    borderRadius: 8,
    gap: 12,
    paddingHorizontal: 30,
    paddingVertical: 32,
  },
  heroTitle: {
    color: '#f2f7f9',
    fontSize: Platform.OS === 'web' ? 56 : 28,
    fontWeight: '800',
    lineHeight: Platform.OS === 'web' ? 62 : 34,
    maxWidth: 760,
  },
  heroCopy: {
    color: '#d4e2e6',
    fontSize: Platform.OS === 'web' ? 18 : 15,
    lineHeight: Platform.OS === 'web' ? 28 : 22,
    maxWidth: 840,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#153841',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: '#f8fcfe',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d8dde3',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    color: '#24343a',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#16242b',
    fontSize: 20,
    fontWeight: '800',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe0e6',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 88,
    padding: 14,
    width: '48%',
  },
  optionActive: {
    backgroundColor: '#e7f2ff',
    borderColor: '#4879ad',
  },
  optionTitle: {
    color: '#23302b',
    fontSize: 16,
    fontWeight: '800',
  },
  optionTitleActive: {
    color: '#174b79',
  },
  optionMeta: {
    color: '#5d6c74',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  segmentGroup: {
    backgroundColor: '#ebeff3',
    borderRadius: 8,
    flexDirection: 'row',
    padding: 4,
  },
  segment: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    paddingVertical: 10,
  },
  segmentActive: {
    backgroundColor: '#ffffff',
  },
  segmentText: {
    color: '#5e6d75',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  segmentTextActive: {
    color: '#1d2c33',
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderColor: '#d8dde3',
    borderRadius: 8,
    borderWidth: 1,
    color: '#1c2d35',
    fontSize: 15,
    minHeight: 104,
    padding: 14,
    textAlignVertical: 'top',
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderColor: '#d8dde3',
    borderRadius: 8,
    borderWidth: 1,
    color: '#1c2d35',
    fontSize: 15,
    minHeight: 52,
    padding: 14,
  },
  passwordField: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d8dde3',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
  },
  passwordInput: {
    color: '#1c2d35',
    flex: 1,
    fontSize: 15,
    padding: 14,
  },
  passwordToggle: {
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  passwordToggleText: {
    color: '#22363f',
    fontSize: 22,
    fontWeight: '900',
  },
  authStatus: {
    color: '#63737b',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  errorText: {
    backgroundColor: '#fde8df',
    borderRadius: 8,
    color: '#87331f',
    fontSize: 13,
    fontWeight: '800',
    padding: 12,
  },
  noticeText: {
    backgroundColor: '#e7f2ff',
    borderRadius: 8,
    color: '#174b79',
    fontSize: 13,
    fontWeight: '800',
    padding: 12,
  },
  summaryPanel: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe0e6',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 20,
  },
  eyebrow: {
    color: '#4879ad',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  summaryTitle: {
    color: '#15242b',
    fontSize: Platform.OS === 'web' ? 28 : 22,
    fontWeight: '900',
  },
  summaryCopy: {
    color: '#5c6d75',
    fontSize: 16,
    lineHeight: 24,
  },
  providerPanel: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe0e6',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  providerTitle: {
    color: '#18272f',
    fontSize: 18,
    fontWeight: '800',
  },
  providerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  providerCopy: {
    color: '#5c6d75',
    fontSize: 13,
    lineHeight: 19,
  },
  moduleCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe0e6',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  moduleNumber: {
    color: '#4879ad',
    fontSize: 12,
    fontWeight: '800',
  },
  moduleTitle: {
    color: '#18272f',
    fontSize: Platform.OS === 'web' ? 22 : 17,
    fontWeight: '800',
  },
  moduleCopy: {
    color: '#5c6d75',
    fontSize: 15,
    lineHeight: 23,
  },
  progressTrack: {
    backgroundColor: '#dfe5ea',
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#2f8a68',
    height: 8,
  },
  sessionCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dbe0e6',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 18,
  },
  pulse: {
    backgroundColor: '#1e8f7b',
    borderRadius: 18,
    height: 36,
    width: 36,
  },
  sessionText: {
    flex: 1,
    gap: 4,
  },
  sessionTitle: {
    color: '#18272f',
    fontSize: 20,
    fontWeight: '800',
  },
  sessionMeta: {
    color: '#607179',
    fontSize: 14,
    lineHeight: 20,
  },
  tutorWindowDock: {
    alignItems: 'flex-end',
    width: '100%',
  },
  tutorWindow: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dbe0e6',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minWidth: 248,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tutorVideoFrame: {
    borderColor: '#9bb6c2',
    borderRadius: 8,
    borderWidth: 1,
    height: 68,
    overflow: 'hidden',
    shadowColor: '#17a2a0',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    width: 90,
  },
  tutorVideo: {
    height: '100%',
    width: '100%',
  },
  tutorWindowText: {
    gap: 2,
  },
  tutorWindowTitle: {
    color: '#1d2a31',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  tutorFace: {
    color: '#1e3f4a',
    fontSize: 16,
    fontWeight: '700',
  },
  tutorWindowState: {
    color: '#607179',
    fontSize: 13,
    fontWeight: '700',
  },
  voiceBars: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  voiceBar: {
    backgroundColor: '#1a6676',
    borderRadius: 2,
    height: 10,
    width: 4,
  },
  message: {
    borderRadius: 8,
    gap: 6,
    padding: 14,
  },
  tutorMessage: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe0e6',
    borderWidth: 1,
    marginRight: 26,
  },
  learnerMessage: {
    backgroundColor: '#dceff8',
    borderColor: '#c7dfea',
    borderWidth: 1,
    marginLeft: 26,
  },
  messageRole: {
    color: '#4879ad',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  messageText: {
    color: '#22343d',
    fontSize: 15,
    lineHeight: 22,
  },
  badgeCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe0e6',
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  badgeName: {
    color: '#18272f',
    fontSize: 24,
    fontWeight: '900',
  },
  badgeDescription: {
    color: '#5c6d75',
    fontSize: 14,
    lineHeight: 20,
  },
  scoreGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metric: {
    backgroundColor: '#f1f5f8',
    borderColor: '#dbe2e8',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 5,
    padding: 12,
  },
  metricLabel: {
    color: '#68726d',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: '#18201d',
    fontSize: 15,
    fontWeight: '900',
  },
});
