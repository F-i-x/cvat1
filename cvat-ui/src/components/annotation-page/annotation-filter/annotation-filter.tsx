// Copyright (C) 2020 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { Tag } from 'antd';
import React, { ReactElement } from 'react';
import './style.scss';

const openFilterPanel = (): void => {
    alert('FILTER PANEL OPENED');
};

const AnnotationFilter = (): ReactElement => (
    <div className='annotation-filter-wrapper' onClick={openFilterPanel}>
        <Tag
            closable
            onClick={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => e.stopPropagation()}
            onClose={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
                e.preventDefault();
                alert('Close');
            }}
        >
            Prevent
        </Tag>
        <Tag
            closable
            onClick={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => e.stopPropagation()}
            onClose={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
                e.preventDefault();
                alert('Close');
            }}
        >
            Default
        </Tag>
        <Tag
            closable
            onClick={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => e.stopPropagation()}
            onClose={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
                e.preventDefault();
                alert('Close');
            }}
        >
            PD
        </Tag>
        <Tag
            closable
            onClick={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => e.stopPropagation()}
            onClose={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
                e.preventDefault();
                alert('Close');
            }}
        >
            Prevent Default
        </Tag>
    </div>
);

export default AnnotationFilter;
