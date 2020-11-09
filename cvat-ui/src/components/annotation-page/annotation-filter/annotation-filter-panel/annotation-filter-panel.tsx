// Copyright (C) 2020 Intel Corporation
//
// SPDX-License-Identifier: MIT

import {
    Button, Icon, Input, Modal,
} from 'antd';
import PropTypes from 'prop-types';
import React, { ReactElement, useEffect, useState } from 'react';
import './annotation-filter-panel.scss';

interface Props {
    isVisible: boolean;
    onClose: Function;
    onAddNew: Function;
}

const AnnotationFilterPanel = ({ isVisible, onClose, onAddNew }: Props): ReactElement => {
    const [visible, setVisible] = useState(isVisible);

    useEffect(() => {
        setVisible(isVisible);
        return () => {
            setVisible(false);
        };
    }, [isVisible]);

    return (
        <Modal
            className='annotation-filters-panel'
            onCancel={() => onClose()}
            visible={visible}
            footer={false}
            mask={false}
            width={300}
        >
            <Icon className='ant-modal-help' onClick={() => alert('Help')} type='question-circle' />
            <h3>Add new filter</h3>
            <div className='filter-option-wrapper'>
                <div className='filter-option'>
                    <span className='filter-option-label lg'>Add as new with operator</span>
                    <Input size='small' />
                </div>
                <div className='filter-option'>
                    <span className='filter-option-label'>Filter by</span>
                    <Input size='small' />
                </div>
                <div className='filter-option'>
                    <span className='filter-option-label'>List for</span>
                    <Input size='small' />
                    <span className='postfix'>label</span>
                </div>
                <div className='filter-option'>
                    <span className='filter-option-label'>Attribute</span>
                    <Input size='small' />
                </div>
                <div className='filter-option'>
                    <span className='filter-option-label'>Value</span>
                    <Input size='small' />
                </div>
                <div className='filter-option'>
                    <span className='filter-option-label'>List for</span>
                    <Input size='small' />
                    <span className='postfix'>label</span>
                </div>
                <div className='filter-option'>
                    <span className='filter-option-label'>Attribute</span>
                    <Input size='small' />
                </div>
            </div>

            <div className='filter-action-wrapper'>
                <Button onClick={() => alert('Combine')}>Combine</Button>
                <Button type='primary' onClick={() => onAddNew(50)}>
                    Add new
                </Button>
            </div>
        </Modal>
    );
};

AnnotationFilterPanel.propTypes = {
    isVisible: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    onAddNew: PropTypes.func.isRequired,
};

export default AnnotationFilterPanel;
