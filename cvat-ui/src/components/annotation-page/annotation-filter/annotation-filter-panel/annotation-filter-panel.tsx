// Copyright (C) 2020 Intel Corporation
//
// SPDX-License-Identifier: MIT

import {
    Button, Cascader, Icon, Modal,
} from 'antd';
import PropTypes from 'prop-types';
import React, {
    ReactElement, useEffect, useReducer, useState,
} from 'react';
import './annotation-filter-panel.scss';

interface Props {
    isFirst?: boolean;
    isVisible: boolean;
    onClose: Function;
    onAddNew: Function;
}

interface State {
    operator: string;
    filterBy: string;
}

enum ActionType {
    operator,
    filterBy,
    reset,
}

const operatorOptions: { [key: string]: string }[] = [
    { label: 'and (&)', value: 'and' },
    { label: 'or (|)', value: 'or' },
];

const filterByOptions: { [key: string]: string }[] = [
    { label: 'Label', value: 'label' },
    { label: 'Width', value: 'width' },
    { label: 'Height', value: 'height' },
    { label: 'Server ID', value: 'serverID' },
    { label: 'Client ID', value: 'clientID' },
    { label: 'Type', value: 'type' },
    { label: 'Shape', value: 'shape' },
    { label: 'Occluded', value: 'occluded' },
    { label: 'Attribute', value: 'attribute' },
    { label: 'Empty Frame', value: 'empty_frame' },
];

const initialState: State = {
    operator: '',
    filterBy: '',
};

const reducer = (state: State, action: { type: ActionType; payload?: any }): State => {
    switch (action.type) {
        case ActionType.operator:
            return { ...state, operator: action.payload };
        case ActionType.filterBy:
            return { ...state, filterBy: action.payload };
        case ActionType.reset:
            return { ...state, ...initialState };
        default:
            return state;
    }
};

const AnnotationFilterPanel = ({
    isFirst, isVisible, onClose, onAddNew,
}: Props): ReactElement => {
    const [visible, setVisible] = useState(isVisible);
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        setTimeout(() => dispatch({ type: ActionType.reset }), 100);
        setVisible(isVisible);
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
                    <span className='filter-option-label operator'>Add as new with operator</span>
                    <div className='filter-option-value'>
                        <Cascader
                            options={operatorOptions}
                            onChange={(value: string[]) => dispatch({ type: ActionType.operator, payload: value[0] })}
                            value={[state.operator]}
                            disabled={isFirst}
                            popupClassName='cascader-popup operator'
                            placeholder=''
                            size='small'
                        />
                    </div>
                </div>
                <div className='filter-option'>
                    <span className='filter-option-label'>Filter by</span>
                    <div className='filter-option-value'>
                        <Cascader
                            options={filterByOptions}
                            onChange={(value: string[]) => dispatch({ type: ActionType.filterBy, payload: value[0] })}
                            value={[state.filterBy]}
                            popupClassName='cascader-popup'
                            placeholder=''
                            size='small'
                        />
                    </div>
                </div>
                {state.filterBy && (
                    <div className='filter-option'>
                        <span className='filter-option-label'>
                            {filterByOptions.find((option) => option.value === state.filterBy)?.label}
                        </span>
                        <div className='filter-option-value'>
                            <Cascader
                                options={[
                                    { label: 'Label', value: 'label' },
                                    { label: 'Width', value: 'width' },
                                    { label: 'Height', value: 'height' },
                                    { label: 'Server ID', value: 'serverID' },
                                    { label: 'Client ID', value: 'clientID' },
                                    { label: 'Type', value: 'type' },
                                    { label: 'Shape', value: 'shape' },
                                    { label: 'Occluded', value: 'occluded' },
                                    { label: 'Attribute', value: 'attribute' },
                                    { label: 'Empty Frame', value: 'empty_frame' },
                                ]}
                                // eslint-disable-next-line max-len
                                onChange={(value: string[]) => dispatch({ type: ActionType.filterBy, payload: value[0] })}
                                value={[state.filterBy]}
                                popupClassName='cascader-popup'
                                placeholder=''
                                size='small'
                            />
                        </div>
                    </div>
                )}

                {/* <div className='filter-option'>
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
                </div> */}
            </div>

            <div className='filter-action-wrapper'>
                <Button onClick={() => alert('Combine')}>Combine</Button>
                <Button
                    type='primary'
                    onClick={() => {
                        dispatch({ type: ActionType.reset });
                        onAddNew(state);
                    }}
                >
                    Add new
                </Button>
            </div>
        </Modal>
    );
};

AnnotationFilterPanel.propTypes = {
    isFirst: PropTypes.bool,
    isVisible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onAddNew: PropTypes.func.isRequired,
};

export default AnnotationFilterPanel;
