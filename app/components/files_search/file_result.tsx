// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useRef, useState} from 'react';
import {type LayoutChangeEvent, StyleSheet, View} from 'react-native';

import File from '@components/files/file';
import {useWindowDimensions} from '@hooks/device';

import Options from './file_options/file_options';

import type {GalleryAction} from '@typings/screens/gallery';

export type XyOffset = {x: number; y: number; width: number} | undefined;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 20,
    },
});

type Props = {
    canDownloadFiles: boolean;
    channelName?: string;
    enableSecureFilePreview: boolean;
    publicLinkEnabled: boolean;
    fileInfo: FileInfo;
    index: number;
    onOptionsPress: (finfo: FileInfo) => void;
    onPress: (idx: number) => void;
    setAction: (action: GalleryAction) => void;
    updateFileForGallery: (idx: number, file: FileInfo) => void;
}

const galleryIdentifier = 'search-files-location';

const FileResult = ({
    canDownloadFiles,
    channelName,
    enableSecureFilePreview,
    fileInfo,
    index,
    publicLinkEnabled,
    onOptionsPress,
    onPress,
    setAction,
    updateFileForGallery,
}: Props) => {
    const elementsRef = useRef<View | null>(null);
    const [width, setWidth] = useState(0);
    const onLayout = useCallback(({nativeEvent: {layout}}: LayoutChangeEvent) => {
        // This view has already deducted the cell's horizontal margins.
        setWidth(layout.width);

        // Window-anchored menus must be measured again after a pane reflow.
        setShowOptions(false);
    }, []);

    const [showOptions, setShowOptions] = useState<boolean>(false);
    const [openUp, setOpenUp] = useState<boolean>(false);
    const [xyOffset, setXYoffset] = useState<XyOffset>(undefined);
    const {height} = useWindowDimensions();

    const handleOptionsPress = useCallback((fInfo: FileInfo) => {
        elementsRef.current?.measureInWindow((x, y, cellWidth, h) => {
            const openUpwards = (y > height / 2);
            const offsetY = openUpwards ? (y + (h / 2)) : (y - (h / 2));
            setOpenUp(openUpwards);
            setXYoffset({x, y: offsetY, width: cellWidth});
            setShowOptions(true);
            onOptionsPress(fInfo);
        });
    }, [height, onOptionsPress]);

    const handleSetAction = useCallback((action: GalleryAction) => {
        setAction(action);
        if (showOptions && action !== 'none') {
            setShowOptions(false);
        }
    }, [setAction, showOptions]);

    return (
        <>
            <View
                ref={elementsRef}
                style={styles.container}
                collapsable={false}
                onLayout={onLayout}
            >
                <File
                    asCard={true}
                    canDownloadFiles={canDownloadFiles}
                    enableSecureFilePreview={enableSecureFilePreview}
                    channelName={channelName}
                    file={fileInfo}
                    galleryIdentifier={galleryIdentifier}
                    inViewPort={true}
                    index={index}
                    nonVisibleImagesCount={0}
                    onOptionsPress={handleOptionsPress}
                    onPress={onPress}
                    optionSelected={showOptions}
                    showDate={true}
                    updateFileForGallery={updateFileForGallery}
                    wrapperWidth={width}
                />
            </View>
            {showOptions && Boolean(xyOffset) &&
                <Options
                    fileInfo={fileInfo}
                    canDownloadFiles={canDownloadFiles}
                    enableSecureFilePreview={enableSecureFilePreview}
                    publicLinkEnabled={publicLinkEnabled}
                    openUp={openUp}
                    setAction={handleSetAction}
                    setShowOptions={setShowOptions}
                    xyOffset={xyOffset}
                />
            }
        </>
    );
};

export default React.memo(FileResult);
