import { ConvexReactClient } from "convex/react";
import Constants from "expo-constants";

const url =
  (Constants.expoConfig?.extra?.convexUrl as string) ??
  "https://successful-panda-576.convex.cloud";

export const convex = new ConvexReactClient(url, { unsavedChangesWarning: false });
