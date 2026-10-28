// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Portal} from '@gorhom/portal';
import {useIsFocused} from '@react-navigation/native';
import {router} from 'expo-router';
import React from 'react';
import {useIntl} from 'react-intl';
import {I18nManager, Pressable} from 'react-native';

import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import {useTheme} from '@context/theme';
import {makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import {useExpandedNavigation} from '.';

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    button: {minWidth: 44, minHeight: 64, padding: 8, alignItems: 'center'},
    pressed: {opacity: 0.72},
    label: {color: theme.centerChannelColor, ...typography('Body', 75)},
}));

// Mounted only in the expanded shell. Focus is the owning route's focus, not
// the portal host's: outgoing headers must not leave a second Back behind.
export default function ExpandedBack({onPress, children}: React.PropsWithChildren<{onPress: () => void}>) {
    const focused = useIsFocused();
    const {backHost} = useExpandedNavigation();
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const intl = useIntl();
    if (!focused || !router.canGoBack()) {
        return null;
    }
    return (
        <Portal hostName={backHost}>
            <Pressable
                testID='duo.navigation.back'
                accessibilityRole='button'
                accessibilityLabel={intl.formatMessage({id: 'generic.back', defaultMessage: 'Back'})}
                onPress={onPress}
                style={({pressed}) => [styles.button, pressed && styles.pressed]}
            >
                <CompassIcon
                    name={I18nManager.isRTL ? 'arrow-right' : 'arrow-left'}
                    size={24}
                    color={theme.centerChannelColor}
                />
                {children}
                <FormattedText
                    id='generic.back'
                    defaultMessage='Back'
                    style={styles.label}
                />
            </Pressable>
        </Portal>
    );
}
