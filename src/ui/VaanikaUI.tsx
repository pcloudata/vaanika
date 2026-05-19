import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenShellProps = {
  badgeLabel?: string;
  children: ReactNode;
  homeHref?: Href;
};

export function ScreenShell({ badgeLabel = 'Live', children, homeHref }: ScreenShellProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
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
      </ScrollView>
    </SafeAreaView>
  );
}

export function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.secondaryButton, disabled && styles.secondaryButtonDisabled]}>
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
    backgroundColor: '#f7f4ee',
  },
  page: {
    gap: 18,
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brandBlock: {
    flex: 1,
    paddingRight: 14,
  },
  brand: {
    color: '#18201d',
    fontSize: 34,
    fontWeight: '800',
  },
  tagline: {
    color: '#5e6b64',
    fontSize: 14,
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#d8f0c7',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#24532c',
    fontSize: 12,
    fontWeight: '800',
  },
  headerButton: {
    backgroundColor: '#fffdf8',
    borderColor: '#dfd8cc',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerButtonText: {
    color: '#20352d',
    fontSize: 12,
    fontWeight: '800',
  },
  hero: {
    backgroundColor: '#20352d',
    borderRadius: 8,
    gap: 12,
    padding: 20,
  },
  heroTitle: {
    color: '#fffdf7',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  heroCopy: {
    color: '#d8e4db',
    fontSize: 15,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#20352d',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: '#fffdf8',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#fffdf8',
    borderColor: '#dfd8cc',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    color: '#20352d',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#18201d',
    fontSize: 18,
    fontWeight: '800',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    backgroundColor: '#fffdf8',
    borderColor: '#dfd8cc',
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
    color: '#65736c',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  segmentGroup: {
    backgroundColor: '#e7e1d8',
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
    backgroundColor: '#fffdf8',
  },
  segmentText: {
    color: '#68726d',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  segmentTextActive: {
    color: '#18201d',
  },
  textArea: {
    backgroundColor: '#fffdf8',
    borderColor: '#dfd8cc',
    borderRadius: 8,
    borderWidth: 1,
    color: '#18201d',
    fontSize: 15,
    minHeight: 104,
    padding: 14,
    textAlignVertical: 'top',
  },
  textInput: {
    backgroundColor: '#fffdf8',
    borderColor: '#dfd8cc',
    borderRadius: 8,
    borderWidth: 1,
    color: '#18201d',
    fontSize: 15,
    minHeight: 52,
    padding: 14,
  },
  passwordField: {
    alignItems: 'center',
    backgroundColor: '#fffdf8',
    borderColor: '#dfd8cc',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
  },
  passwordInput: {
    color: '#18201d',
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
    color: '#20352d',
    fontSize: 22,
    fontWeight: '900',
  },
  authStatus: {
    color: '#65736c',
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
    backgroundColor: '#fffdf8',
    borderColor: '#dfd8cc',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  eyebrow: {
    color: '#4879ad',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  summaryTitle: {
    color: '#18201d',
    fontSize: 22,
    fontWeight: '900',
  },
  summaryCopy: {
    color: '#5d6963',
    fontSize: 14,
    lineHeight: 20,
  },
  providerPanel: {
    backgroundColor: '#fffdf8',
    borderColor: '#dfd8cc',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  providerTitle: {
    color: '#18201d',
    fontSize: 16,
    fontWeight: '800',
  },
  providerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  providerCopy: {
    color: '#5d6963',
    fontSize: 13,
    lineHeight: 19,
  },
  moduleCard: {
    backgroundColor: '#fffdf8',
    borderRadius: 8,
    gap: 8,
    padding: 16,
  },
  moduleNumber: {
    color: '#4879ad',
    fontSize: 12,
    fontWeight: '800',
  },
  moduleTitle: {
    color: '#18201d',
    fontSize: 17,
    fontWeight: '800',
  },
  moduleCopy: {
    color: '#5d6963',
    fontSize: 13,
    lineHeight: 19,
  },
  progressTrack: {
    backgroundColor: '#e5ddd1',
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#77a567',
    height: 8,
  },
  sessionCard: {
    alignItems: 'center',
    backgroundColor: '#fffdf8',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  pulse: {
    backgroundColor: '#e45f48',
    borderRadius: 18,
    height: 36,
    width: 36,
  },
  sessionText: {
    flex: 1,
    gap: 4,
  },
  sessionTitle: {
    color: '#18201d',
    fontSize: 16,
    fontWeight: '800',
  },
  sessionMeta: {
    color: '#65736c',
    fontSize: 12,
    lineHeight: 17,
  },
  message: {
    borderRadius: 8,
    gap: 6,
    padding: 14,
  },
  tutorMessage: {
    backgroundColor: '#fffdf8',
    marginRight: 26,
  },
  learnerMessage: {
    backgroundColor: '#dcecf6',
    marginLeft: 26,
  },
  messageRole: {
    color: '#4879ad',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  messageText: {
    color: '#25302c',
    fontSize: 14,
    lineHeight: 20,
  },
  badgeCard: {
    backgroundColor: '#fffdf8',
    borderRadius: 8,
    gap: 14,
    padding: 18,
  },
  badgeName: {
    color: '#18201d',
    fontSize: 20,
    fontWeight: '900',
  },
  badgeDescription: {
    color: '#5d6963',
    fontSize: 14,
    lineHeight: 20,
  },
  scoreGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metric: {
    backgroundColor: '#f1ece3',
    borderRadius: 8,
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
    fontSize: 14,
    fontWeight: '900',
  },
});
