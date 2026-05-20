import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type WebShellProps = {
  children: ReactNode;
  homeHref?: Href;
  pageBackgroundUri?: string;
};

export function WebShell({ children, homeHref, pageBackgroundUri }: WebShellProps) {
  const { width } = useWindowDimensions();
  const isCompactWeb = width < 920;
  const pageBody = (
    <ScrollView contentContainerStyle={[styles.page, isCompactWeb && styles.pageCompact]}>
      <View style={[styles.content, isCompactWeb && styles.contentCompact]}>
        <View style={[styles.header, isCompactWeb && styles.headerCompact]}>
          <View style={styles.brandBlock}>
            <Text style={[styles.brand, isCompactWeb && styles.brandCompact]}>Vaanika</Text>
            <Text style={[styles.tagline, isCompactWeb && styles.taglineCompact]}>Your AI language tutor, anytime.</Text>
          </View>
          {homeHref ? (
            <Link href={homeHref} asChild>
              <Pressable style={styles.homeButton}>
                <Text style={styles.homeButtonText}>Home</Text>
              </Pressable>
            </Link>
          ) : null}
        </View>
        {children}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {pageBackgroundUri ? (
        <ImageBackground
          source={{ uri: pageBackgroundUri }}
          style={styles.pageBackground}
          imageStyle={styles.pageBackgroundImage}
        >
          <View style={styles.pageBackgroundOverlay} />
          {pageBody}
        </ImageBackground>
      ) : (
        pageBody
      )}
    </SafeAreaView>
  );
}

type WebBannerProps = {
  imageUri: string;
  title: string;
  subtitle: string;
};

export function WebBanner({ imageUri, title, subtitle }: WebBannerProps) {
  return (
    <ImageBackground source={{ uri: imageUri }} style={webStyles.banner} imageStyle={webStyles.bannerImage}>
      <View style={webStyles.bannerOverlay} />
      <View style={webStyles.bannerContent}>
        <Text style={webStyles.bannerTitle}>{title}</Text>
        <Text style={webStyles.bannerSubtitle}>{subtitle}</Text>
      </View>
    </ImageBackground>
  );
}

export const webStyles = StyleSheet.create({
  pageGrid: {
    gap: 18,
  },
  twoColumn: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 18,
  },
  columnMain: {
    flex: 1.4,
    gap: 18,
  },
  columnSide: {
    flex: 1,
    gap: 18,
  },
  hero: {
    backgroundColor: '#10353e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f4b56',
    minHeight: 360,
    overflow: 'hidden',
    position: 'relative',
  },
  heroOverlay: {
    backgroundColor: 'rgba(8, 31, 39, 0.62)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  heroContent: {
    gap: 12,
    paddingHorizontal: 30,
    paddingVertical: 30,
    position: 'relative',
    zIndex: 2,
  },
  heroTitle: {
    color: '#f3f8fa',
    fontSize: 46,
    fontWeight: '800',
    lineHeight: 52,
    maxWidth: 680,
  },
  heroCopy: {
    color: '#cfe0e5',
    fontSize: 18,
    lineHeight: 27,
    maxWidth: 680,
  },
  sideCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7dde2',
    padding: 18,
    gap: 10,
  },
  sideTitle: {
    color: '#1c2c33',
    fontSize: 20,
    fontWeight: '800',
  },
  sideCopy: {
    color: '#5a6b73',
    fontSize: 14,
    lineHeight: 21,
  },
  authCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7dde2',
    padding: 22,
    gap: 14,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  authGrid: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 18,
  },
  authMain: {
    flex: 1.2,
    gap: 18,
  },
  authSide: {
    flex: 0.8,
    gap: 18,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    backgroundColor: '#f4f7fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dce3e8',
    flex: 1,
    gap: 6,
    padding: 12,
  },
  kpiLabel: {
    color: '#61727b',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  kpiValue: {
    color: '#182930',
    fontSize: 18,
    fontWeight: '900',
  },
  formGrid: {
    gap: 12,
  },
  formLabel: {
    color: '#1d2b33',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionLabel: {
    color: '#356fa8',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  dashboardGrid: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 18,
  },
  dashboardPrimary: {
    flex: 1.1,
    gap: 18,
  },
  dashboardSecondary: {
    flex: 1,
    gap: 18,
  },
  lessonGrid: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 18,
  },
  lessonMain: {
    flex: 1.2,
    gap: 16,
  },
  lessonSide: {
    flex: 0.8,
    gap: 16,
  },
  transcriptPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7dde2',
    gap: 10,
    padding: 16,
  },
  previewRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  previewButtonWrap: {
    width: 280,
  },
  banner: {
    borderRadius: 12,
    minHeight: 150,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    borderRadius: 12,
  },
  bannerOverlay: {
    backgroundColor: 'rgba(10, 35, 44, 0.58)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  bannerContent: {
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 20,
    position: 'relative',
    zIndex: 2,
  },
  bannerTitle: {
    color: '#f2f8fb',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  bannerSubtitle: {
    color: '#d7e5ea',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 680,
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef2f5',
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
    paddingHorizontal: 28,
    paddingVertical: 28,
  },
  pageCompact: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  content: {
    width: '100%',
    maxWidth: 1180,
    gap: 22,
  },
  contentCompact: {
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCompact: {
    alignItems: 'flex-start',
  },
  brandBlock: {
    gap: 4,
    flex: 1,
  },
  brand: {
    color: '#122025',
    fontSize: 56,
    fontWeight: '800',
  },
  brandCompact: {
    fontSize: 34,
  },
  tagline: {
    color: '#50626a',
    fontSize: 18,
  },
  taglineCompact: {
    fontSize: 14,
  },
  homeButton: {
    backgroundColor: '#ffffff',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#d7dde2',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  homeButtonText: {
    color: '#213239',
    fontSize: 12,
    fontWeight: '800',
  },
});
