// Copyright (C) 2020 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { Icon, Popconfirm } from 'antd';
import React, { ReactElement, useRef, useState } from 'react';
import AnnotationFiltersItem from '../annotation-filters-item/annotation-filters-item';
import './style.scss';

const AnnotationFilterPanel = (): ReactElement => {
    const [filters, setFilters] = useState([] as number[]);
    const filtersEndRef = useRef<null | HTMLDivElement>(null);
    const clearFiltersRef = useRef<null | HTMLAnchorElement>(null);

    const scrollFiltersToBottom = (): void => {
        setTimeout(() => filtersEndRef?.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 100);
    };

    const resetFilters = (e: React.MouseEvent<HTMLElement, MouseEvent>): void => {
        e.preventDefault();
        setFilters([]);
    };

    const confirmClearFilters = (e: React.MouseEvent<HTMLElement, MouseEvent>): void => {
        e.preventDefault();
        clearFiltersRef?.current?.click();
    };

    const openFilterPanel = (): void => {
        setFilters([...filters, Math.floor(Math.random() * 10)]);
        scrollFiltersToBottom();
    };

    return (
        <div
            className='annotation-filters-pane'
            onClick={openFilterPanel}
            onContextMenu={(e: React.MouseEvent<HTMLElement, MouseEvent>) => confirmClearFilters(e)}
        >
            {filters?.length ? (
                <>
                    {filters.map((item: number) => (
                        <AnnotationFiltersItem key={item} item={item} />
                    ))}
                    <div className='pop-confirm-wrapper' onClick={(e) => e.stopPropagation()}>
                        <Popconfirm
                            placement='bottom'
                            title='Are you sure you want to clear all filters?'
                            icon={<Icon type='question-circle-o' style={{ color: 'red' }} />}
                            onConfirm={(e) => resetFilters(e)}
                            okText='Yes'
                            cancelText='No'
                        >
                            <span ref={clearFiltersRef} />
                        </Popconfirm>
                    </div>
                    <div ref={filtersEndRef} />
                </>
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
