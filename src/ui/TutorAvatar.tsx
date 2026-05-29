import { type ComponentType } from 'react';
import { Image, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

type LottieViewProps = {
  source: unknown;
  autoPlay?: boolean;
  loop?: boolean;
  speed?: number;
  resizeMode?: 'cover' | 'contain' | 'center';
  style?: StyleProp<ViewStyle>;
};

// lottie-react-native resolves to the native module on iOS/Android and to the
// @lottiefiles/dotlottie-react web player on web. We require it defensively so a
// missing native binding (e.g. an old build) degrades to the static fallback
// instead of crashing the lesson screen.
let LottieView: ComponentType<LottieViewProps> | null = null;
try {
  const mod = require('lottie-react-native') as
    | { default?: ComponentType<LottieViewProps> }
    | ComponentType<LottieViewProps>;
  LottieView = ((mod as { default?: ComponentType<LottieViewProps> }).default ??
    (mod as ComponentType<LottieViewProps>)) ?? null;
} catch {
  LottieView = null;
}

const tutorTalkingSource = require('../../assets/tutor/tutorTalking.json');

export type TutorAvatarProps = {
  /** When true the tutor face talks briskly; otherwise it idles gently. */
  speaking: boolean;
  style?: StyleProp<ViewStyle>;
  /** Image URI shown if the Lottie runtime is unavailable. */
  fallbackUri?: string;
};

export function TutorAvatar({ speaking, style, fallbackUri }: TutorAvatarProps) {
  if (!LottieView) {
    if (fallbackUri) {
      return <Image source={{ uri: fallbackUri }} style={style as StyleProp<ImageStyle>} />;
    }
    return <View style={style} />;
  }

  return (
    <LottieView
      source={tutorTalkingSource}
      autoPlay
      loop
      speed={speaking ? 1.35 : 0.4}
      resizeMode="contain"
      style={style}
    />
  );
}
