// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React, { RefObject } from 'react';
import { Row, Col } from 'antd/lib/grid';
import Icon, { CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import Input from 'antd/lib/input';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Tooltip from 'antd/lib/tooltip';
import Select from 'antd/lib/select';
import Form, { FormInstance } from 'antd/lib/form';
import Badge from 'antd/lib/badge';
import { Store } from 'antd/lib/form/interface';

import ColorPicker from 'components/annotation-page/standard-workspace/objects-side-bar/color-picker';
import { ColorizeIcon } from 'icons';
import patterns from 'utils/validation-patterns';
import consts from 'consts';
import {
    equalArrayHead, idGenerator, Label, Attribute,
} from './common';

export enum AttributeType {
    SELECT = 'SELECT',
    RADIO = 'RADIO',
    CHECKBOX = 'CHECKBOX',
    TEXT = 'TEXT',
    NUMBER = 'NUMBER',
}

interface Props {
    label: Label | null;
    labelNames?: string[];
    onSubmit: (label: Label | null) => void;
}

export default class LabelForm extends React.Component<Props> {
    private continueAfterSubmit: boolean;
    private formRef: RefObject<FormInstance>;

    constructor(props: Props) {
        super(props);
        this.continueAfterSubmit = false;
        this.formRef = React.createRef<FormInstance>();
    }

    private handleSubmit = (values: Store): void => {
        const { label, onSubmit } = this.props;

        onSubmit({
            name: values.name,
            id: label ? label.id : idGenerator(),
            color: values.color,
            attributes: values.attributes.map((attribute: Store) => {
                let attrValues: string | string[] = attribute.values;
                if (!Array.isArray(attrValues)) {
                    if (attribute.type === AttributeType.NUMBER) {
                        attrValues = attrValues.split(';');
                    } else {
                        attrValues = [attrValues];
                    }
                }
                attrValues = attrValues.map((value: string) => value.trim());

                return {
                    ...attribute,
                    values: attrValues,
                    input_type: attribute.type.toLowerCase(),
                };
            }),
        });

        if (this.formRef.current) {
            this.formRef.current.resetFields();
            this.formRef.current.setFieldsValue({ attributes: [] });
        }

        if (!this.continueAfterSubmit) {
            onSubmit(null);
        }
    };

    private addAttribute = (): void => {
        if (this.formRef.current) {
            const attributes = this.formRef.current.getFieldValue('attributes');
            this.formRef.current.setFieldsValue({ attributes: [...attributes, { id: idGenerator() }] });
        }
    };

    private removeAttribute = (key: number): void => {
        if (this.formRef.current) {
            const attributes = this.formRef.current.getFieldValue('attributes');
            this.formRef.current.setFieldsValue({
                attributes: attributes.filter((_: any, id: number) => id !== key),
            });
        }
    };

    /* eslint-disable class-methods-use-this */
    private renderAttributeNameInput(fieldInstance: any, attr: Attribute | null): JSX.Element {
        const { key } = fieldInstance;
        const locked = attr ? attr.id >= 0 : false;
        const value = attr ? attr.name : '';

        return (
            <Form.Item
                hasFeedback
                name={[key, 'name']}
                fieldKey={[fieldInstance.fieldKey, 'name']}
                initialValue={value}
                rules={[
                    {
                        required: true,
                        message: 'Please specify a name',
                    },
                    {
                        pattern: patterns.validateAttributeName.pattern,
                        message: patterns.validateAttributeName.message,
                    },
                ]}
            >
                <Input className='cvat-attribute-name-input' disabled={locked} placeholder='Name' />
            </Form.Item>
        );
    }

    private renderAttributeTypeInput(fieldInstance: any, attr: Attribute | null): JSX.Element {
        const { key } = fieldInstance;
        const locked = attr ? attr.id >= 0 : false;
        const type = attr ? attr.input_type.toUpperCase() : AttributeType.SELECT;

        return (
            <Tooltip title='An HTML element representing the attribute' mouseLeaveDelay={0}>
                <Form.Item name={[key, 'type']} fieldKey={[fieldInstance.fieldKey, 'type']} initialValue={type}>
                    <Select className='cvat-attribute-type-input' disabled={locked}>
                        <Select.Option value={AttributeType.SELECT} className='cvat-attribute-type-input-select'>
                            Select
                        </Select.Option>
                        <Select.Option value={AttributeType.RADIO} className='cvat-attribute-type-input-radio'>
                            Radio
                        </Select.Option>
                        <Select.Option value={AttributeType.CHECKBOX} className='cvat-attribute-type-input-checkbox'>
                            Checkbox
                        </Select.Option>
                        <Select.Option value={AttributeType.TEXT} className='cvat-attribute-type-input-text'>
                            Text
                        </Select.Option>
                        <Select.Option value={AttributeType.NUMBER} className='cvat-attribute-type-input-number'>
                            Number
                        </Select.Option>
                    </Select>
                </Form.Item>
            </Tooltip>
        );
    }

    private renderAttributeValuesInput(fieldInstance: any, attr: Attribute | null): JSX.Element {
        const { key } = fieldInstance;
        const locked = attr ? attr.id >= 0 : false;
        const existedValues = attr ? attr.values : [];

        const validator = (_: any, values: string[], callback: any): void => {
            if (locked && existedValues) {
                if (!equalArrayHead(existedValues, values)) {
                    callback('You can only append new values');
                }
            }

            for (const value of values) {
                if (!patterns.validateAttributeValue.pattern.test(value)) {
                    callback(`Invalid attribute value: "${value}"`);
                }
            }

            callback();
        };

        return (
            <Tooltip title='Press enter to add a new value' mouseLeaveDelay={0}>
                <Form.Item
                    name={[key, 'values']}
                    fieldKey={[fieldInstance.fieldKey, 'values']}
                    initialValue={existedValues}
                    rules={[
                        {
                            required: true,
                            message: 'Please specify values',
                        },
                        {
                            validator,
                        },
                    ]}
                >
                    <Select
                        className='cvat-attribute-values-input'
                        mode='tags'
                        placeholder='Attribute values'
                        dropdownStyle={{ display: 'none' }}
                    />
                </Form.Item>
            </Tooltip>
        );
    }

    private renderBooleanValueInput(fieldInstance: any, attr: Attribute | null): JSX.Element {
        const { key } = fieldInstance;
        const value = attr ? attr.values[0] : 'false';

        return (
            <Tooltip title='Specify a default value' mouseLeaveDelay={0}>
                <Form.Item name={[key, 'values']} fieldKey={[fieldInstance.fieldKey, 'values']} initialValue={value}>
                    <Select className='cvat-attribute-values-input'>
                        <Select.Option value='false'>False</Select.Option>
                        <Select.Option value='true'>True</Select.Option>
                    </Select>
                </Form.Item>
            </Tooltip>
        );
    }

    private renderNumberRangeInput(fieldInstance: any, attr: Attribute | null): JSX.Element {
        const { key } = fieldInstance;
        const locked = attr ? attr.id >= 0 : false;
        const value = attr ? attr.values.join(';') : '';

        const validator = (_: any, strNumbers: string, callback: any): void => {
            const numbers = strNumbers.split(';').map((number): number => Number.parseFloat(number));
            if (numbers.length !== 3) {
                callback('Three numbers are expected');
            }

            for (const number of numbers) {
                if (Number.isNaN(number)) {
                    callback(`"${number}" is not a number`);
                }
            }

            const [min, max, step] = numbers;

            if (min >= max) {
                callback('Minimum must be less than maximum');
            }

            if (max - min < step) {
                callback('Step must be less than minmax difference');
            }

            if (step <= 0) {
                callback('Step must be a positive number');
            }

            callback();
        };

        return (
            <Form.Item
                name={[key, 'values']}
                fieldKey={[fieldInstance.fieldKey, 'values']}
                initialValue={value}
                rules={[
                    {
                        required: true,
                        message: 'Please set a range',
                    },
                    {
                        validator,
                    },
                ]}
            >
                <Input className='cvat-attribute-values-input' disabled={locked} placeholder='min;max;step' />
            </Form.Item>
        );
    }

    private renderDefaultValueInput(fieldInstance: any, attr: Attribute | null): JSX.Element {
        const { key } = fieldInstance;
        const value = attr ? attr.values[0] : '';

        return (
            <Form.Item name={[key, 'values']} fieldKey={[fieldInstance.fieldKey, 'values']} initialValue={value}>
                <Input className='cvat-attribute-values-input' placeholder='Default value' />
            </Form.Item>
        );
    }

    private renderMutableAttributeInput(fieldInstance: any, attr: Attribute | null): JSX.Element {
        const { key } = fieldInstance;
        const locked = attr ? attr.id >= 0 : false;
        const value = attr ? attr.mutable : false;

        return (
            <Tooltip title='Can this attribute be changed frame to frame?' mouseLeaveDelay={0}>
                <Form.Item
                    name={[key, 'mutable']}
                    fieldKey={[fieldInstance.fieldKey, 'mutable']}
                    initialValue={value}
                    valuePropName='checked'
                >
                    <Checkbox className='cvat-attribute-mutable-checkbox' disabled={locked}>
                        Mutable
                    </Checkbox>
                </Form.Item>
            </Tooltip>
        );
    }

    private renderDeleteAttributeButton(fieldInstance: any, attr: Attribute | null): JSX.Element {
        const { key } = fieldInstance;
        const locked = attr ? attr.id >= 0 : false;

        return (
            <Tooltip title='Delete the attribute' mouseLeaveDelay={0}>
                <Form.Item>
                    <Button
                        type='link'
                        className='cvat-delete-attribute-button'
                        disabled={locked}
                        onClick={(): void => {
                            this.removeAttribute(key);
                        }}
                    >
                        <CloseCircleOutlined />
                    </Button>
                </Form.Item>
            </Tooltip>
        );
    }

    private renderAttribute = (fieldInstance: any): JSX.Element => {
        const { label } = this.props;
        const { key } = fieldInstance;
        const fieldValue = this.formRef.current?.getFieldValue('attributes')[key];
        const attr = label ? label.attributes.filter((_attr: any): boolean => _attr.id === fieldValue.id)[0] : null;

        return (
            <Form.Item noStyle key={key} shouldUpdate>
                {() => (
                    <Row
                        justify='space-between'
                        align='middle'
                        cvat-attribute-id={fieldValue.id}
                        className='cvat-attribute-inputs-wrapper'
                    >
                        <Col span={5}>{this.renderAttributeNameInput(fieldInstance, attr)}</Col>
                        <Col span={4}>{this.renderAttributeTypeInput(fieldInstance, attr)}</Col>
                        <Col span={6}>
                            {((): JSX.Element => {
                                const currentFieldValue = this.formRef.current?.getFieldValue('attributes')[key];
                                const type = currentFieldValue.type || AttributeType.SELECT;
                                let element = null;
                                if ([AttributeType.SELECT, AttributeType.RADIO].includes(type)) {
                                    element = this.renderAttributeValuesInput(fieldInstance, attr);
                                } else if (type === AttributeType.CHECKBOX) {
                                    element = this.renderBooleanValueInput(fieldInstance, attr);
                                } else if (type === AttributeType.NUMBER) {
                                    element = this.renderNumberRangeInput(fieldInstance, attr);
                                } else {
                                    element = this.renderDefaultValueInput(fieldInstance, attr);
                                }

                                return element;
                            })()}
                        </Col>
                        <Col span={5}>{this.renderMutableAttributeInput(fieldInstance, attr)}</Col>
                        <Col span={2}>{this.renderDeleteAttributeButton(fieldInstance, attr)}</Col>
                    </Row>
                )}
            </Form.Item>
        );
    };

    private renderLabelNameInput(): JSX.Element {
        const { label, labelNames } = this.props;
        const value = label ? label.name : '';
        const locked = label ? label.id >= 0 : false;

        return (
            <Form.Item
                hasFeedback
                name='name'
                initialValue={value}
                rules={[
                    {
                        required: true,
                        message: 'Please specify a name',
                    },
                    {
                        pattern: patterns.validateAttributeName.pattern,
                        message: patterns.validateAttributeName.message,
                    },
                    {
                        validator: async (_rule: any, labelName: string, callback: Function) => {
                            if (labelNames && labelNames.includes(labelName)) {
                                callback('Label name must be unique for the task');
                            }
                        },
                    },
                ]}
            >
                <Input disabled={locked} placeholder='Label name' />
            </Form.Item>
        );
    }

    private renderNewAttributeButton(): JSX.Element {
        return (
            <Form.Item>
                <Button type='ghost' onClick={this.addAttribute} className='cvat-new-attribute-button'>
                    Add an attribute
                    <PlusOutlined />
                </Button>
            </Form.Item>
        );
    }

    private renderDoneButton(): JSX.Element {
        return (
            <Tooltip title='Save the label and return' mouseLeaveDelay={0}>
                <Button
                    style={{ width: '150px' }}
                    type='primary'
                    htmlType='submit'
                    onClick={(): void => {
                        this.continueAfterSubmit = false;
                    }}
                >
                    Done
                </Button>
            </Tooltip>
        );
    }

    private renderContinueButton(): JSX.Element | null {
        const { label } = this.props;

        if (label) return null;
        return (
            <Tooltip title='Save the label and create one more' mouseLeaveDelay={0}>
                <Button
                    style={{ width: '150px' }}
                    type='primary'
                    htmlType='submit'
                    onClick={(): void => {
                        this.continueAfterSubmit = true;
                    }}
                >
                    Continue
                </Button>
            </Tooltip>
        );
    }

    private renderCancelButton(): JSX.Element {
        const { onSubmit } = this.props;

        return (
            <Tooltip title='Do not save the label and return' mouseLeaveDelay={0}>
                <Button
                    type='primary'
                    danger
                    style={{ width: '150px' }}
                    onClick={(): void => {
                        onSubmit(null);
                    }}
                >
                    Cancel
                </Button>
            </Tooltip>
        );
    }

    private renderChangeColorButton(): JSX.Element {
        const { label } = this.props;

        return (
            <Form.Item noStyle shouldUpdate>
                {() => (
                    <Form.Item name='color' initialValue={label ? label?.color : undefined}>
                        <ColorPicker placement='bottom'>
                            <Tooltip title='Change color of the label'>
                                <Button type='default' className='cvat-change-task-label-color-button'>
                                    <Badge
                                        className='cvat-change-task-label-color-badge'
                                        color={this.formRef.current?.getFieldValue('color') || consts.NEW_LABEL_COLOR}
                                        text={<Icon component={ColorizeIcon} />}
                                    />
                                </Button>
                            </Tooltip>
                        </ColorPicker>
                    </Form.Item>
                )}
            </Form.Item>
        );
    }

    private renderAttributes() {
        return (fieldInstances: any[]): JSX.Element[] => fieldInstances.map(this.renderAttribute);
    }

    // eslint-disable-next-line react/sort-comp
    public componentDidMount(): void {
        const { label } = this.props;
        if (this.formRef.current) {
            const convertedAttributes = label ?
                label.attributes.map(
                    (attribute: Attribute): Store => ({
                        ...attribute,
                        type: attribute.input_type.toUpperCase(),
                    }),
                ) :
                [];

            for (const attr of convertedAttributes) {
                delete attr.input_type;
            }

            this.formRef.current.setFieldsValue({ attributes: convertedAttributes });
        }
    }

    public render(): JSX.Element {
        return (
            <Form onFinish={this.handleSubmit} layout='vertical' ref={this.formRef}>
                <Row justify='start' align='middle'>
                    <Col span={10}>{this.renderLabelNameInput()}</Col>
                    <Col span={3} offset={1}>
                        {this.renderChangeColorButton()}
                    </Col>
                    <Col span={6} offset={1}>
                        {this.renderNewAttributeButton()}
                    </Col>
                </Row>
                <Row justify='start' align='middle'>
                    <Col span={24}>
                        <Form.List name='attributes'>{this.renderAttributes()}</Form.List>
                    </Col>
                </Row>
                <Row justify='start' align='middle'>
                    <Col>{this.renderDoneButton()}</Col>
                    <Col offset={1}>{this.renderContinueButton()}</Col>
                    <Col offset={1}>{this.renderCancelButton()}</Col>
                </Row>
            </Form>
        );
    }
}
