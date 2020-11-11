// Copyright (C) 2020 Intel Corporation
//
// SPDX-License-Identifier: MIT

import {
    Button, Cascader, Icon, Modal,
} from 'antd';
import PropTypes from 'prop-types';
import React, { ReactElement, useEffect, useReducer } from 'react';
import './annotation-filter-panel.scss';

interface Props {
    isFirst?: boolean;
    isVisible: boolean;
    onClose: Function;
    onAddNew: Function;
}

interface State {
    concatenator: string;
    filterBy: string;
    operator: string;
    operatorValue: string;
}

enum ActionType {
    concatenator,
    filterBy,
    operator,
    operatorValue,
    reset,
}

enum ConcatenatorOptionsValues {
    or = '|',
    and = '&',
}

enum FilterByValues {
    label = 'label',
    width = 'width',
    height = 'height',
    serverID = 'serverID',
    clientID = 'clientID',
    type = 'type',
    shape = 'shape',
    occluded = 'occluded',
    attribute = 'attribute',
    empty_frame = 'empty_frame',
}

enum FilterByTypeValues {
    shape = 'shape',
    track = 'track',
}

enum FilterByShapeValues {
    rectangle = 'rectangle',
    points = 'points',
    polyline = 'polyline',
    polygon = 'polygon',
    cuboids = 'cuboids',
    tag = 'tag',
}

enum OperatorOptionsValues {
    eq = '==',
    neq = '!=',
    gt = '>',
    gte = '>=',
    lt = '<',
    lte = '<=',
}

enum NumericFilterByOptions {
    width,
    height,
    serverID,
    clientID,
}

const concatenatorOptions: { [key: string]: string }[] = [
    { label: 'and (&)', value: ConcatenatorOptionsValues.and },
    { label: 'or (|)', value: ConcatenatorOptionsValues.or },
];

const filterByOptions: { [key: string]: string | FilterByValues }[] = [
    { label: 'Label', value: FilterByValues.label },
    { label: 'Width', value: FilterByValues.width },
    { label: 'Height', value: FilterByValues.height },
    { label: 'Server ID', value: FilterByValues.serverID },
    { label: 'Client ID', value: FilterByValues.clientID },
    { label: 'Type', value: FilterByValues.type },
    { label: 'Shape', value: FilterByValues.shape },
    { label: 'Occluded', value: FilterByValues.occluded },
    { label: 'Attribute', value: FilterByValues.attribute },
    { label: 'Empty Frame', value: FilterByValues.empty_frame },
];

const filterByBooleanOptions: { [key: string]: string | boolean }[] = [
    { label: 'True', value: true },
    { label: 'False', value: false },
];

const filterByTypeOptions: { [key: string]: string }[] = [
    { label: 'Shape', value: FilterByTypeValues.shape },
    { label: 'Track', value: FilterByTypeValues.track },
];

const filterByShapeOptions: { [key: string]: string }[] = [
    { label: 'Rectangle', value: FilterByShapeValues.rectangle },
    { label: 'Points', value: FilterByShapeValues.points },
    { label: 'Polyline', value: FilterByShapeValues.polyline },
    { label: 'Polygon', value: FilterByShapeValues.polygon },
    { label: 'Cuboids', value: FilterByShapeValues.cuboids },
    { label: 'Tag', value: FilterByShapeValues.tag },
];

const operatorOptions: { [key: string]: string | boolean }[] = [
    { label: OperatorOptionsValues.eq, value: OperatorOptionsValues.eq, any: true },
    { label: OperatorOptionsValues.neq, value: OperatorOptionsValues.neq, any: true },
    { label: OperatorOptionsValues.gt, value: OperatorOptionsValues.gt, any: false },
    { label: OperatorOptionsValues.gte, value: OperatorOptionsValues.gte, any: false },
    { label: OperatorOptionsValues.lt, value: OperatorOptionsValues.lt, any: false },
    { label: OperatorOptionsValues.lte, value: OperatorOptionsValues.lte, any: false },
];

const reducer = (state: State, action: { type: ActionType; payload?: any }): State => {
    switch (action.type) {
        case ActionType.concatenator:
            return { ...state, concatenator: action.payload };
        case ActionType.filterBy:
            return { ...state, filterBy: action.payload };
        case ActionType.operator:
            return { ...state, operator: action.payload };
        case ActionType.operatorValue:
            return { ...state, operatorValue: action.payload };
        case ActionType.reset:
            return {} as State;
        default:
            return state;
    }
};

const AnnotationFilterPanel = ({
    isFirst, isVisible, onClose, onAddNew,
}: Props): ReactElement => {
    const [state, dispatch] = useReducer(reducer, {} as State);

    useEffect(() => {
        setTimeout(() => dispatch({ type: ActionType.reset }), 100);
    }, [isVisible]);

    const getOperatorOptions = (): { [key: string]: any }[] => {
        if (!Object.values(NumericFilterByOptions).includes(state.filterBy)) {
            return operatorOptions.filter((option) => option.any);
        }
        return operatorOptions;
    };

    const getOperatorValueOptions = (): { [key: string]: any }[] => {
        switch (state.filterBy) {
            case FilterByValues.type:
                return filterByTypeOptions;
            case FilterByValues.shape:
                return filterByShapeOptions;
            case FilterByValues.occluded:
                return filterByBooleanOptions;
            default:
                return [];
        }
    };

    return (
        <Modal
            className='annotation-filters-panel'
            onCancel={() => onClose()}
            visible={isVisible}
            footer={false}
            mask={false}
            width={300}
        >
            <Icon className='ant-modal-help' onClick={() => alert('Help')} type='question-circle' />
            <h3>Add new filter</h3>
            <div className='filter-option-wrapper'>
                <div className='filter-option'>
                    <span className='filter-option-label concatenator'>Add as new with operator</span>
                    <div className='filter-option-value-wrapper'>
                        <div className='filter-option-value'>
                            <Cascader
                                options={concatenatorOptions}
                                // eslint-disable-next-line max-len
                                onChange={(value: string[]) => dispatch({ type: ActionType.concatenator, payload: value[0] })}
                                value={[state.concatenator]}
                                popupClassName={`cascader-popup options-${concatenatorOptions.length} concatenator`}
                                disabled={isFirst}
                                allowClear={false}
                                placeholder=''
                                size='small'
                            />
                        </div>
                    </div>
                </div>
                <div className='filter-option'>
                    <span className='filter-option-label'>Filter by</span>
                    <div className='filter-option-value-wrapper'>
                        <div className='filter-option-value'>
                            <Cascader
                                options={filterByOptions}
                                // eslint-disable-next-line max-len
                                onChange={(value: string[]) => dispatch({ type: ActionType.filterBy, payload: value[0] })}
                                value={[state.filterBy]}
                                popupClassName={`cascader-popup options-${filterByOptions.length}`}
                                allowClear={false}
                                placeholder=''
                                size='small'
                            />
                        </div>
                    </div>
                </div>
                {state.filterBy && (
                    <div className='filter-option'>
                        <span className='filter-option-label'>
                            {filterByOptions.find((option) => option.value === state.filterBy)?.label}
                        </span>
                        <div className='filter-option-value-wrapper'>
                            <div className='filter-option-value operator'>
                                <Cascader
                                    // eslint-disable-next-line max-len
                                    options={getOperatorOptions()}
                                    // eslint-disable-next-line max-len
                                    onChange={(value: string[]) => dispatch({ type: ActionType.operator, payload: value[0] })}
                                    value={[state.operator]}
                                    popupClassName={`cascader-popup options-${getOperatorOptions().length} operator`}
                                    allowClear={false}
                                    placeholder=''
                                    size='small'
                                />
                            </div>
                            <div className='filter-option-value'>
                                <Cascader
                                    options={getOperatorValueOptions()}
                                    // eslint-disable-next-line max-len
                                    onChange={(value: string[]) => dispatch({ type: ActionType.operatorValue, payload: value[0] })}
                                    value={[state.operatorValue]}
                                    popupClassName={`cascader-popup options-${getOperatorValueOptions().length} value`}
                                    allowClear={false}
                                    placeholder=''
                                    size='small'
                                />
                            </div>
                        </div>
                    </div>
                )}
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
