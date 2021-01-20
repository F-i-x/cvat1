// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import Icon from '@ant-design/icons';
import Tooltip from 'antd/lib/tooltip';
import Popover from 'antd/lib/popover';

import { RotateIcon } from 'icons';
import { Rotation } from 'reducers/interfaces';

import withVisibilityHandling from './handle-popover-visibility';

interface Props {
    clockwiseShortcut: string;
    anticlockwiseShortcut: string;
    rotateFrame(rotation: Rotation): void;
}

function RotateControl(props: Props): JSX.Element {
    const { anticlockwiseShortcut, clockwiseShortcut, rotateFrame } = props;
    const CustomPopover = withVisibilityHandling(Popover, 'rotate-canvas');

    return (
        <CustomPopover
            placement='right'
            content={(
                <>
                    <Tooltip
                        title={`Rotate the image anticlockwise ${anticlockwiseShortcut}`}
                        placement='topRight'
                        mouseLeaveDelay={0}
                    >
                        <Icon
                            className='cvat-rotate-canvas-controls-left'
                            onClick={(): void => rotateFrame(Rotation.ANTICLOCKWISE90)}
                            component={RotateIcon}
                        />
                    </Tooltip>
                    <Tooltip
                        title={`Rotate the image clockwise ${clockwiseShortcut}`}
                        placement='topRight'
                        mouseLeaveDelay={0}
                    >
                        <Icon
                            className='cvat-rotate-canvas-controls-right'
                            onClick={(): void => rotateFrame(Rotation.CLOCKWISE90)}
                            component={RotateIcon}
                        />
                    </Tooltip>
                </>
            )}
            trigger='hover'
        >
            <Icon className='cvat-rotate-canvas-control' component={RotateIcon} />
        </CustomPopover>
    );
}

export default React.memo(RotateControl);
