// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {PortalHost} from '@gorhom/portal';
import React, {createContext, useCallback, useContext, useId, useMemo, useState, type PropsWithChildren} from 'react';
import {I18nManager, type LayoutChangeEvent, ScrollView, View, type StyleProp, type ViewStyle} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useTheme} from '@context/theme';
import {makeStyleSheetFromTheme} from '@utils/theme';

import {isAdaptiveControlsEnabled, useDevelopmentOverride} from './development';
import {getAdaptivePlacement, RAIL_WIDTH, type Placement} from './policy';

const AdaptiveContext = createContext<{placement: Placement; hostName: string}>({placement: 'horizontal', hostName: ''});
export const useAdaptiveControls = () => useContext(AdaptiveContext);

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    shell: {flex: 1, direction: 'ltr'},
    start: {flexDirection: 'row'},
    end: {flexDirection: 'row-reverse'},
    content: {flex: 1, minWidth: 0},
    rail: {width: RAIL_WIDTH, backgroundColor: theme.sidebarBg},
    hidden: {display: 'none'},
}));

// Lives inside Channel's SafeAreaView: onLayout excludes its left/right padding
// (and bottom on phones; tablets retain the existing tab-bar inset ownership).
// It does not observe the shrinking conversation pane itself.
export default function AdaptiveChannelLayout({children}: PropsWithChildren) {
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const insets = useSafeAreaInsets();
    const override = useDevelopmentOverride();
    const [size, setSize] = useState({width: 0, height: 0});
    const hostName = `channel-adaptive-controls-${useId()}`;
    const placement = getAdaptivePlacement({
        enabled: isAdaptiveControlsEnabled(),
        development: __DEV__,
        override,
        usableWidth: size.width,
        usableHeight: size.height - insets.top,
    });
    const onLayout = useCallback(({nativeEvent: {layout}}: LayoutChangeEvent) => {
        setSize({width: layout.width, height: layout.height});
    }, []);
    const context = useMemo(() => ({placement, hostName}), [placement, hostName]);
    const direction = I18nManager.isRTL ? 'rtl' : 'ltr';
    const contentStyle = useMemo<StyleProp<ViewStyle>>(() => [styles.content, {direction}], [styles.content, direction]);
    const railStyle = useMemo<StyleProp<ViewStyle>>(() => [styles.rail, {paddingTop: insets.top, direction}, placement === 'horizontal' && styles.hidden], [styles, insets.top, direction, placement]);

    return (
        <AdaptiveContext.Provider value={context}>
            <View
                testID='channel.adaptive.shell'
                onLayout={onLayout}
                style={[styles.shell, placement === 'side-end' ? styles.end : styles.start]}
            >
                <View
                    testID='channel.adaptive.rail'
                    style={railStyle}
                >
                    <ScrollView
                        testID='channel.adaptive.rail.scroll'
                        keyboardShouldPersistTaps='handled'
                    >
                        {placement !== 'horizontal' && <PortalHost name={hostName}/>}
                    </ScrollView>
                </View>
                <View
                    testID='channel.adaptive.content'
                    style={contentStyle}
                >
                    {children}
                </View>
            </View>
        </AdaptiveContext.Provider>
    );
}
