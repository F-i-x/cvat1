// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import Popover from 'antd/lib/popover';
import Icon from '@ant-design/icons';

import { Canvas } from 'cvat-canvas-wrapper';
import { TagIcon } from 'icons';

import SetupTagPopoverContainer from 'containers/annotation-page/standard-workspace/controls-side-bar/setup-tag-popover';
import withVisibilityHandling from './handle-popover-visibility';

interface Props {
    canvasInstance: Canvas;
    isDrawing: boolean;
}

function SetupTagControl(props: Props): JSX.Element {
    const { isDrawing } = props;
    const CustomPopover = withVisibilityHandling(Popover, 'setup-tag');

    const dynamcPopoverPros = isDrawing ?
        {
            overlayStyle: {
                display: 'none',
            },
        } :
        {};

    return (
        <CustomPopover {...dynamcPopoverPros} placement='right' content={<SetupTagPopoverContainer />}>
            <Icon className='cvat-setup-tag-control' component={TagIcon} />
        </CustomPopover>
    );
}

export default React.memo(SetupTagControl);
