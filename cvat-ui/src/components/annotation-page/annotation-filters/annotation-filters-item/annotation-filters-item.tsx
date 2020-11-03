// Copyright (C) 2020 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { Tag } from 'antd';
import PropTypes from 'prop-types';
import React, { ReactElement } from 'react';
import './style.scss';

interface Props {
    item: number;
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
    item: PropTypes.number.isRequired,
};

export default AnnotationFiltersItem;
