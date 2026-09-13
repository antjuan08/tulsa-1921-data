// Placeholder root for the React Native + react-native-tvos OTT app.
//
// This file intentionally avoids importing `react-native` so the workspace
// typechecks without pulling in the full RN dependency tree. To bring this
// up as a real RN app:
//
//   1. From `learning-hub/apps/tv`:
//        npx @react-native-community/cli init OttTv --skip-install
//      then swap `react-native` for `react-native-tvos` in package.json.
//   2. Replace this file's contents with a real RN component tree.
//   3. Wire in @ott/ui-tokens and @ott/types from the workspace.
//   4. Configure Metro to resolve the workspace symlinks.
//
// The Home/Browse/Search shell sketched below is the structure to build first.

import { colors, typography } from '@ott/ui-tokens';
import type { CourseWithRelations } from '@ott/types';

export type AppProps = { initialCourses?: CourseWithRelations[] };

export function getInitialStyles() {
  return {
    background: colors.background.base,
    foreground: colors.foreground.primary,
    accent: colors.accent.DEFAULT,
    headlineFont: typography.fontFamily.serif[0],
  };
}

export default function App(_props: AppProps) {
  // Real RN component tree goes here. Suggested structure:
  //   <SafeAreaView>
  //     <TVFocusGuideView>
  //       <Tabs>
  //         <HomeScreen />
  //         <BrowseScreen />
  //         <SearchScreen />
  //       </Tabs>
  //     </TVFocusGuideView>
  //   </SafeAreaView>
  return null;
}
