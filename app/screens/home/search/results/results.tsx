// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useMemo, useState} from 'react';
import {Freeze} from 'react-freeze';
import {type LayoutChangeEvent, StyleSheet, View} from 'react-native';
import Animated, {useAnimatedStyle, withTiming} from 'react-native-reanimated';

import FileResults from '@components/files_search/file_results';
import Loading from '@components/loading';
import {useTheme} from '@context/theme';
import {TabTypes, type TabType} from '@utils/search';

import PostResults from './post_results';

import type ChannelModel from '@typings/database/models/servers/channel';
import type PostModel from '@typings/database/models/servers/post';
import type UserModel from '@typings/database/models/servers/user';

const duration = 250;

const getStyles = (width: number) => {
    return StyleSheet.create({
        viewport: {
            flex: 1,
            overflow: 'hidden',
        },
        container: {
            flex: 1,
            flexDirection: 'row',
            width: width * 2,
        },
        result: {
            flexShrink: 0,
            width,
        },
        loading: {
            justifyContent: 'center',
            flex: 1,
            width,
        },
    });
};

type Props = {
    currentUser: UserModel;
    appsEnabled: boolean;
    canDownloadFiles: boolean;
    currentTimezone: string;
    customEmojiNames: string[];
    enableSecureFilePreview: boolean;
    fileChannels: ChannelModel[];
    fileInfos: FileInfo[];
    loading: boolean;
    posts: PostModel[];
    matches?: SearchMatches;
    publicLinkEnabled: boolean;
    scrollPaddingTop: number;
    searchValue: string;
    selectedTab: TabType;
}

const Results = ({
    appsEnabled,
    canDownloadFiles,
    currentUser,
    currentTimezone,
    customEmojiNames,
    enableSecureFilePreview,
    fileChannels,
    fileInfos,
    loading,
    posts,
    matches,
    publicLinkEnabled,
    scrollPaddingTop,
    searchValue,
    selectedTab,
}: Props) => {
    const [width, setWidth] = useState(0);
    const onLayout = useCallback(({nativeEvent: {layout}}: LayoutChangeEvent) => {
        setWidth(layout.width);
    }, []);
    const theme = useTheme();
    const styles = useMemo(() => getStyles(width), [width]);

    const transform = useAnimatedStyle(() => {
        const translateX = selectedTab === TabTypes.MESSAGES ? 0 : -width;
        return {
            transform: [
                {translateX: withTiming(translateX, {duration})},
            ],
        };

        // Do not transform if loading new data. Causes a case where post
        // results show up in Files results when the team is changed
    }, [selectedTab, width, !loading]);

    const paddingTop = useMemo(() => (
        {paddingTop: scrollPaddingTop}
    ), [scrollPaddingTop]);

    return (
        <View
            onLayout={onLayout}
            style={styles.viewport}
        >
            {loading &&
                <Loading
                    color={theme.buttonBg}
                    size='large'
                    containerStyle={[styles.loading, paddingTop]}
                />
            }
            {!loading &&
            <Animated.View style={[styles.container, transform]}>
                <View style={styles.result}>
                    <Freeze freeze={selectedTab !== TabTypes.MESSAGES}>
                        <PostResults
                            currentUser={currentUser}
                            appsEnabled={appsEnabled}
                            currentTimezone={currentTimezone}
                            customEmojiNames={customEmojiNames}
                            posts={posts}
                            matches={matches}
                            paddingTop={paddingTop}
                            searchValue={searchValue}
                        />
                    </Freeze>
                </View>
                <View style={styles.result}>
                    <Freeze freeze={selectedTab !== TabTypes.FILES}>
                        <FileResults
                            canDownloadFiles={canDownloadFiles}
                            enableSecureFilePreview={enableSecureFilePreview}
                            fileChannels={fileChannels}
                            fileInfos={fileInfos}
                            paddingTop={paddingTop}
                            publicLinkEnabled={publicLinkEnabled}
                            searchValue={searchValue}
                        />
                    </Freeze>
                </View>
            </Animated.View>
            }
        </View>
    );
};

export default React.memo(Results);
