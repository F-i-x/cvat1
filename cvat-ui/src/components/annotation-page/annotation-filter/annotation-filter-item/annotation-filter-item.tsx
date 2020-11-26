// Copyright (C) 2020 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { Tag } from 'antd';
import PropTypes from 'prop-types';
import React, { ReactElement } from 'react';
import './annotation-filter-item.scss';

interface Props {
    item: any;
}

// TODO: DRY
enum BooleanFilterByOptions {
    occluded,
    empty_frame,
}
function AnnotationFilterItem({ item }: Props): ReactElement {
    // TODO: DRY
    const isBooleanFilterBy = (): boolean => Object.values(BooleanFilterByOptions).includes(item.filterBy);

    return (
        <>
            {item.concatenator && ` ${item.concatenator} `}
            <Tag
                className='annotation-filters-item'
                onClick={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => e.stopPropagation()}
                onClose={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
                    e.preventDefault();
                    alert('Close');
                }}
                closable
            >
                {isBooleanFilterBy() && `${item.filterBy} is ${item.value}`}
                {item.attribute && `attr["${item.attribute}"]${item.attributeOperator}${item.attributeValue}`}
                {!isBooleanFilterBy() && !item.attribute && `${item.filterBy}${item.operator}${item.value}`}
            </Tag>
        </>
    );
}

AnnotationFilterItem.propTypes = {
    item: PropTypes.objectOf(PropTypes.any),
};

export default AnnotationFilterItem;
