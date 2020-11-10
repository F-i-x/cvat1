// Copyright (C) 2020 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { Tag } from 'antd';
import PropTypes from 'prop-types';
import React, { ReactElement } from 'react';
import './annotation-filter-item.scss';

interface Props {
    item: string;
}

function AnnotationFiltersItem({ item }: Props): ReactElement {
    return (
        <Tag
            className='annotation-filters-item'
            onClick={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => e.stopPropagation()}
            onClose={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
                e.preventDefault();
                alert('Close');
            }}
            closable
        >
            {item}
        </Tag>
    );
}

AnnotationFiltersItem.propTypes = {
    item: PropTypes.string.isRequired,
};

export default AnnotationFiltersItem;
