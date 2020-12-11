// Copyright (C) 2020 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { FilterOutlined, PlusOutlined, QuestionOutlined } from '@ant-design/icons';
import { Popconfirm, Tag } from 'antd';
import React, {
    ReactElement, useEffect, useRef, useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import AnnotationFilterItem from '../annotation-filter-item/annotation-filter-item';
import AnnotationFilterPanel from '../annotation-filter-panel/annotation-filter-panel';
import './annotation-filter-pane.scss';

const AnnotationFilterPane = (): ReactElement => {
    const [filters, setFilters] = useState([] as any);
    const [filterPanelVisible, setFilterPanelVisible] = useState(true);

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

    useEffect(() => {
        scrollFiltersToBottom();
    }, [filters]);

    const addNew = (filter: any): void => {
        const newFilter = { ...filter };
        newFilter.id = uuidv4();
        setFilters([...filters, newFilter]);
    };

    return (
        <>
            <div
                className='annotation-filters-pane'
                onClick={() => !filters.length && setFilterPanelVisible(true)}
                style={{ cursor: filters.length ? 'default' : 'pointer' }}
                onContextMenu={(e: React.MouseEvent<HTMLElement, MouseEvent>) => confirmClearFilters(e)}
            >
                {filters?.length ? (
                    <>
                        {filters.map((item: any) => (
                            <AnnotationFilterItem
                                key={item.id}
                                item={item}
                                onEdit={(filterItem) => {
                                    setFilterPanelVisible(true);
                                    console.log(filterItem);
                                }}
                            />
                        ))}
                        <div className='pop-confirm-wrapper' onClick={(e) => e.stopPropagation()}>
                            <Popconfirm
                                placement='bottom'
                                title='Are you sure you want to clear all filters?'
                                icon={<QuestionOutlined style={{ color: 'red' }} />}
                                onConfirm={(e: any) => resetFilters(e)}
                                okText='Yes'
                                cancelText='No'
                            >
                                <span ref={clearFiltersRef} />
                            </Popconfirm>
                        </div>
                        <Tag className='add-more' onClick={() => setFilterPanelVisible(true)}>
                            <PlusOutlined />
                        </Tag>
                        <div ref={filtersEndRef} />
                    </>
                ) : (
                    <div className='no-filters'>
                        <FilterOutlined className='no-filters-icon' />
                        <span>Annotations filters</span>
                    </div>
                )}
            </div>
            <AnnotationFilterPanel
                isFirst={!filters.length}
                isVisible={filterPanelVisible}
                onClose={() => setFilterPanelVisible(false)}
                onAddNew={(filter: any) => addNew(filter)}
            />
        </>
    );
};

export default AnnotationFilterPane;
