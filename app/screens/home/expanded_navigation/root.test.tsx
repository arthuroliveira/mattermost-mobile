// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import AuthenticatedLayout from '../../../routes/(authenticated)/_layout';

jest.mock('@database/components', () => ({withServerDatabase: (Component: unknown) => Component}));
jest.mock('@hooks/use_has_credentials', () => ({useHasCredentials: () => true}));
jest.mock('@components/global_classification_banner', () => ({__esModule: true, default: ({children}: React.PropsWithChildren) => children}));
jest.mock('@gorhom/portal', () => ({PortalHost: () => null}));
jest.mock('expo-router', () => {
    const Stack = ({children}: React.PropsWithChildren) => children;
    Stack.Screen = function Screen() {
        return null;
    };
    return {Stack};
});

it('should host expanded chrome above the authenticated stack', () => {
    const screen = renderWithIntlAndTheme(<AuthenticatedLayout/>);
    expect(screen.getByTestId('duo.navigation.shell')).toBeTruthy();
});
