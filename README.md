# Vaanika

Vaanika is a mobile-first AI language tutor prototype built with Expo and React Native.

## MVP Direction

- Languages: Tamil, Spanish, English, and French.
- Learning mode: adaptive conversation practice.
- Voice routing: Sarvam for Tamil experiments; OpenAI Realtime for global-language realtime sessions.
- Tutor brain: provider-independent course generation, remediation, assessment scoring, and badge logic.
- Backend target: Supabase auth, database, storage, and edge functions.

## Local Development

```sh
npm install
npx tsc --noEmit
npm run ios
npm run android
```

Expo web dependencies are installed for future preview work, but the product target is the mobile app.

## Current Implementation

- `src/screens/MobilePrototypeScreen.tsx` contains the mobile prototype flow.
- `app/` contains the Expo Router mobile flow screens.
- `src/state/VaanikaContext.tsx` keeps shared learner state during the local MVP flow.
- `src/providers/providerRouter.ts` maps languages to the intended provider route.
- `src/services` contains mock voice and tutor-brain provider contracts.
- `src/backend/supabaseClient.ts` initializes Supabase only when public env vars are set.
- `src/services/auth` and `src/services/profile` contain Supabase-backed auth/profile calls with mock-mode fallbacks.
- `src/backend/schemaPlan.ts` documents the Supabase entities and planned edge functions.

## Next Build Steps

1. Add Expo Router or React Navigation for onboarding, course dashboard, tutor session, assessment, and badge screens.
2. Add Supabase client setup and auth screens.
3. Replace mock voice providers with server-issued provider session tokens.
4. Implement adaptive course generation and persistent progress tracking.
