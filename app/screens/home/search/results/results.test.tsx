// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable new-cap */

import React from 'react';
import {FlatList, StyleSheet, View} from 'react-native';

import FileResults from '@components/files_search/file_results';
import Loading from '@components/loading';
import {useWindowDimensions} from '@hooks/device';
import {act, fireEvent, renderWithIntlAndTheme} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';
import {TabTypes} from '@utils/search';

import PostResults from './post_results';
import Results from './results';

jest.mock('@hooks/device', () => ({
    ...jest.requireActual('@hooks/device'),
    useWindowDimensions: jest.fn(() => ({width: 1000, height: 500})),
}));
jest.mock('@components/post_with_channel_info', () => 'PostWithChannelInfo');
jest.mock('@context/post_config', () => ({PostConfigProvider: ({children}: React.PropsWithChildren) => children}));

// Exercise both page geometries synchronously, not React Freeze scheduling.
jest.mock('react-freeze', () => ({Freeze: ({children}: React.PropsWithChildren) => children}));

// Assert the app's animation targets; native animation interpolation is pending.
jest.mock('react-native-reanimated', () => ({
    ...jest.requireActual('react-native-reanimated'),
    __esModule: true,
    useAnimatedStyle: (updater: () => unknown) => updater(),
    withTiming: (value: number) => value,
}));

const props: React.ComponentProps<typeof Results> = {
    currentUser: TestHelper.fakeUserModel(),
    appsEnabled: false,
    canDownloadFiles: false,
    currentTimezone: 'UTC',
    customEmojiNames: [],
    enableSecureFilePreview: true,
    fileChannels: [],
    fileInfos: [],
    loading: false,
    posts: [],
    publicLinkEnabled: false,
    scrollPaddingTop: 12,
    searchValue: 'pane query',
    selectedTab: TabTypes.MESSAGES,
};

type Screen = ReturnType<typeof renderWithIntlAndTheme>;
beforeEach(() => jest.useFakeTimers({doNotFake: ['nextTick']}));
afterEach(() => jest.useRealTimers());

function resize(screen: Screen, width: number) {
    // The outer host is the viewport, not its double-width sliding child.
    fireEvent(screen.UNSAFE_getAllByType(View)[0], 'layout', {nativeEvent: {layout: {width, height: 400}}});
    act(() => jest.advanceTimersByTime(300));
}
function styles(screen: Screen) {
    return screen.UNSAFE_getAllByType(View).map((view) => StyleSheet.flatten(view.props.style));
}

it.each([TabTypes.MESSAGES, TabTypes.FILES])('should budget both empty pages and their slide from the local viewport on %s', (selectedTab) => {
    const screen = renderWithIntlAndTheme(
        <Results
            {...props}
            selectedTab={selectedTab}
        />,
    );
    resize(screen, 459);
    expect(styles(screen)).toEqual(expect.arrayContaining([
        expect.objectContaining({width: 918, transform: [{translateX: selectedTab === TabTypes.FILES ? -459 : 0}]}),
        expect.objectContaining({width: 459}),
    ]));
    expect(styles(screen).filter((style) => style?.width === 459)).toHaveLength(2);
    expect(screen.getAllByText(/pane query/)).toHaveLength(2);
    expect(useWindowDimensions()).toEqual({width: 1000, height: 500});
});

it('should keep the viewport mounted while loading and budget the loader locally', () => {
    const screen = renderWithIntlAndTheme(
        <Results
            {...props}
            loading={true}
        />,
    );
    const viewport = screen.UNSAFE_getAllByType(View)[0];
    resize(screen, 592);
    expect(StyleSheet.flatten(screen.UNSAFE_getByType(Loading).props.containerStyle)).toEqual(expect.objectContaining({width: 592, paddingTop: 12}));
    screen.rerender(<Results {...props}/>);
    expect(screen.UNSAFE_getAllByType(View)[0]).toBe(viewport);
    expect(styles(screen)).toEqual(expect.arrayContaining([expect.objectContaining({width: 1184})]));
});

it('should retain the selected Files page, query and real list instances/scroll offsets on independent pane resize', () => {
    const screen = renderWithIntlAndTheme(
        <Results
            {...props}
            selectedTab={TabTypes.FILES}
            posts={[TestHelper.fakePostModel({id: 'post', message: 'pane query result', createAt: 1})]}
            fileInfos={[{id: 'file', name: 'pane query attachment.bin', extension: 'bin', mime_type: 'application/octet-stream', size: 100} as FileInfo]}
        />,
    );
    resize(screen, 592);
    const lists = screen.UNSAFE_getAllByType(FlatList);
    const files = lists[1].instance;

    // RN's mocked native list cannot prove pixel anchoring; verify retained list
    // ownership and offset, rather than replacing it with a stateful fake list.
    files._listRef._scrollMetrics.offset = 137;
    for (const width of [320, 700, 459]) {
        resize(screen, width);
        expect(screen.UNSAFE_getAllByType(FlatList)).toEqual(lists);
        expect(files._listRef._scrollMetrics.offset).toBe(137);
        expect(styles(screen)).toEqual(expect.arrayContaining([expect.objectContaining({width: width * 2, transform: [{translateX: -width}]})]));
        expect(screen.UNSAFE_getByType(PostResults.type).props.searchValue).toBe('pane query');
        expect(screen.UNSAFE_getByType(FileResults.type).props.searchValue).toBe('pane query');
        expect(screen.getByText('pane query attachment.bin')).toBeTruthy();
    }
});
