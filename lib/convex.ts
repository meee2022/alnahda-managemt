import { ConvexReactClient } from "convex/react";
import Constants from "expo-constants";

const url =
  (process.env.EXPO_PUBLIC_CONVEX_URL as string) ??
  (Constants.expoConfig?.extra?.convexUrl as string) ??
  "https://wooden-buffalo-407.convex.cloud"; // نشر Convex الإنتاجي (افتراضي للبناء المنشور)

export const convex = new ConvexReactClient(url, { unsavedChangesWarning: false });
