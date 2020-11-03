// Copyright (C) 2020 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { Icon } from 'antd';
import React, { ReactElement, useState } from 'react';
import AnnotationFiltersItem from '../annotation-filters-item/annotation-filters-item';
import './style.scss';

const AnnotationFilterPanel = (): ReactElement => {
    const [filters, setFilters] = useState([] as number[]);

    const openFilterPanel = (): void => {
        setFilters([...filters, Math.floor(Math.random() * 100000)]);
    };

    const resetFilters = (e: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
        e.preventDefault();
        setFilters([]);
    };

    return (
        <div
            className='annotation-filters-pane'
            onClick={openFilterPanel}
            onContextMenu={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => resetFilters(e)}
        >
            {filters?.length ? (
                filters.map((item: number) => <AnnotationFiltersItem key={item} item={item} />)
            ) : (
                <div className='no-filters'>
                    <Icon className='no-filters-icon' type='filter' />
                    <span>Click to add filters</span>
                </div>
            )}
        </div>
    );
};

export default AnnotationFilterPanel;
