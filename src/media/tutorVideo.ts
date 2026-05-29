export const TUTOR_VIDEO = {
  teaching:
    process.env.EXPO_PUBLIC_TUTOR_VIDEO_TEACHING_URL ??
    'https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4',
  listening:
    process.env.EXPO_PUBLIC_TUTOR_VIDEO_LISTENING_URL ??
    'https://videos.pexels.com/video-files/3209298/3209298-hd_1920_1080_25fps.mp4',
  answering:
    process.env.EXPO_PUBLIC_TUTOR_VIDEO_ANSWERING_URL ??
    'https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4',
  idle:
    process.env.EXPO_PUBLIC_TUTOR_VIDEO_IDLE_URL ??
    'https://videos.pexels.com/video-files/3209298/3209298-hd_1920_1080_25fps.mp4',
} as const;

export const TUTOR_GIF_FALLBACK =
  process.env.EXPO_PUBLIC_TUTOR_GIF_FALLBACK_URL ??
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXQ4N3QzMWl0ZjR0d3p6c2t6Njl4N2V1c2Ywd2s4a2k4c2V0b3h2dSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/26xBukhZAjxjM2YCs/giphy.gif';
