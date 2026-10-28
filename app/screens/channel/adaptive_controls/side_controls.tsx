// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Portal} from '@gorhom/portal';
import React from 'react';
import {Pressable, Text} from 'react-native';

import CompassIcon from '@components/compass_icon';
import Loading from '@components/loading';
import {type NavigationButtonProps} from '@components/navigation_button';
import {useTheme} from '@context/theme';
import usePressableOpacityStyle from '@hooks/use_pressable_opacity';
import {usePreventDoubleTap} from '@hooks/utils';
import {makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import {useAdaptiveControls} from '.';

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    item: {minHeight: 64, minWidth: 44, alignItems: 'center', justifyContent: 'center', padding: 8},
    disabled: {opacity: 0.32},
    label: {color: theme.sidebarHeaderTextColor, ...typography('Body', 75), textAlign: 'center', maxWidth: '100%'},
}));

type Props = {
    buttons: NavigationButtonProps[];
    backButton?: NavigationButtonProps;
    badge?: React.ReactElement;
};

function SideAction({button, badge}: {button: NavigationButtonProps; badge?: React.ReactElement}) {
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const disabled = Boolean(button.disabled || button.isLoading);
    const pressableStyle = usePressableOpacityStyle([styles.item, disabled && styles.disabled]);
    const onPress = usePreventDoubleTap(button.onPress);
    return (
        <Pressable
            accessible={true}
            accessibilityRole='button'
            accessibilityLabel={button.accessibilityLabel}
            accessibilityState={{disabled, busy: Boolean(button.isLoading)}}
            disabled={disabled}
            onPress={onPress}
            testID={button.testID}
            style={pressableStyle}
        >
            {button.isLoading && <Loading color={theme.sidebarHeaderTextColor}/>}
            {!button.isLoading && button.iconName &&
            <CompassIcon
                name={button.iconName}
                size={24}
                color={button.color ?? theme.sidebarHeaderTextColor}
            />
            }
            <Text
                accessible={false}
                numberOfLines={2}
                ellipsizeMode='tail'
                style={styles.label}
            >
                {button.accessibilityLabel}
            </Text>
            {Boolean(button.count) && <Text style={styles.label}>{button.count}</Text>}
            {badge}
        </Pressable>
    );
}

// The title/info affordance stays above the conversation. Only navigation and
// header actions relocate; the existing overflow sheet remains the overflow UI.
export default function SideControls({buttons, backButton, badge}: Props) {
    const {hostName} = useAdaptiveControls();
    const actions = backButton ? [backButton, ...buttons] : buttons;
    return (
        <Portal hostName={hostName}>
            {actions.map((button) => (
                <SideAction
                    key={button.id}
                    button={button}
                    badge={button.id === 'back' ? badge : undefined}
                />
            ))}
        </Portal>
    );
}
