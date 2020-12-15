// Copyright (C) 2020 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { Tag } from 'antd';
import PropTypes from 'prop-types';
import React, { ReactElement } from 'react';
import './annotation-filter-item.scss';

interface Props {
    item: any;
    onEdit: any;
}

// TODO: DRY
enum BooleanFilterByOptions {
    occluded,
    empty_frame,
}
function AnnotationFilterItem({ item, onEdit }: Props): ReactElement {
    // TODO: DRY
    const isBooleanFilterBy = (): boolean => Object.values(BooleanFilterByOptions).includes(item.filterBy);

    return (
        <>
            {item.concatenator && ` ${item.concatenator} `}
            <Tag
                className='annotation-filters-item'
                onClick={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
                    e.stopPropagation();
                    onEdit(item);
                }}
                onClose={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
                    e.preventDefault();
                    alert('remove filter item');
                }}
                closable
            >
                {isBooleanFilterBy() && `${item.filterBy} is "${item.value}"`}
                {!isBooleanFilterBy() && !item.attribute && `${item.filterBy}${item.operator}"${item.value}"`}

                {item.attribute &&
                    !item.anotherAttributeLabel &&
                    `attr["${item.attribute}"]${item.attributeOperator}"${item.attributeValue}"`}

                {item.anotherAttributeLabel &&
                    `attr["${item.attribute}"]${item.attributeOperator}attr["${item.anotherAttributeValue}"]`}
            </Tag>
        </>
    );
}

AnnotationFilterItem.propTypes = {
    item: PropTypes.objectOf(PropTypes.any),
    onEdit: PropTypes.func.isRequired,
};

export default AnnotationFilterItem;
