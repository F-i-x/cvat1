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

function AnnotationFilterItem({ item }: Props): ReactElement {
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
                {`${item.filterBy}${item.operator}${item.operatorValue}`}
            </Tag>
        </>
    );
}

AnnotationFilterItem.propTypes = {
    item: PropTypes.objectOf(PropTypes.any),
};

export default AnnotationFilterItem;
