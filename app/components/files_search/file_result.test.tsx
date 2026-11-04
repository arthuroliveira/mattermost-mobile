// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable new-cap */

import {Overlay} from '@rneui/base';
import React from 'react';
import {StyleSheet, View} from 'react-native';

import File from '@components/files/file';
import {fireEvent, renderWithIntlAndTheme} from '@test/intl-test-helper';

import FileResult from './file_result';

jest.mock('@hooks/device', () => ({
    ...jest.requireActual('@hooks/device'),
    useWindowDimensions: () => ({width: 1000, height: 500}),
}));
jest.mock('./file_options/option_menus', () => 'OptionMenus');

it('should size the real file card and anchor its actions inside a measured narrow cell, retaining preview actions', () => {
    const onPress = jest.fn();
    const onOptionsPress = jest.fn();
    const fileInfo = {id: 'file', name: 'a very long attachment name.bin', extension: 'bin', mime_type: 'application/octet-stream', size: 1200} as FileInfo;
    const screen = renderWithIntlAndTheme(
        <FileResult
            canDownloadFiles={false}
            enableSecureFilePreview={false}
            publicLinkEnabled={false}
            fileInfo={fileInfo}
            index={3}
            onPress={onPress}
            onOptionsPress={onOptionsPress}
            setAction={jest.fn()}
            updateFileForGallery={jest.fn()}
        />,
    );
    const cell = screen.UNSAFE_getAllByType(View)[0];
    fireEvent(cell, 'layout', {nativeEvent: {layout: {width: 280, height: 60}}});
    expect(screen.UNSAFE_getByType(File.type).props.wrapperWidth).toBe(280);
    fireEvent.press(screen.getByText(fileInfo.name));
    expect(onPress).toHaveBeenCalledWith(3);
    jest.spyOn(cell.instance, 'measureInWindow').mockImplementation((callback: (x: number, y: number, width: number, height: number) => void) => callback(340, 100, 280, 60));
    fireEvent(screen.UNSAFE_getByType(File.type), 'optionsPress', fileInfo);
    expect(onOptionsPress).toHaveBeenCalledWith(fileInfo);
    expect(StyleSheet.flatten(screen.UNSAFE_getByType(Overlay).props.overlayStyle)).toEqual(expect.objectContaining({left: 368, width: 252, marginRight: 0}));
    fireEvent(cell, 'layout', {nativeEvent: {layout: {width: 200, height: 60}}});
    expect(screen.UNSAFE_getByType(File.type).props.wrapperWidth).toBe(200);
});
