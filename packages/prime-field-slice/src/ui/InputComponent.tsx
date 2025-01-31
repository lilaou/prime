import { PrimeFieldProps } from '@primecms/field';
import { Button, Card, Dropdown, Icon, Menu } from 'antd';
import { get } from 'lodash';
import React from 'react';

type ISlice = null | {
  __inputtype: string;
  id: string;
  title: string;
  schema: any;
};

interface IState {
  contentTypes: any[];
  slices: ISlice[];
}

function noChildren(field: any, index: number, allFields: any) {
  return !allFields.find((allFieldsField: any) => {
    if (allFieldsField.id !== field.id && allFieldsField.fields) {
      return allFieldsField.fields.find((innerField: any) => innerField.id === field.id);
    }

    return false;
  });
}

export class InputComponent extends React.Component<PrimeFieldProps, IState> {
  public state: IState = {
    contentTypes: [],
    slices: [],
  };

  public values: any = [];

  public componentDidMount() {
    this.load().catch((err: Error) => {
      console.error(err); // tslint:disable-line no-console
    });
  }

  public componentWillReceiveProps(nextProps: any) {
    if (JSON.stringify(this.props.initialValue) !== JSON.stringify(nextProps.initialValue)) {
      this.setState({
        slices: []
          .concat(nextProps.initialValue || [])
          .map((n: { __inputname: string }, index: number) => ({
            ...this.props.stores.ContentTypes.items.get(n.__inputname),
            index,
          })),
      });
    }
  }

  public async load() {
    const { field, stores } = this.props;
    const ids = get(field.options, 'contentTypeIds', []);
    const initialValue = (this.props.initialValue as any) || [];

    this.setState({
      contentTypes: stores.ContentTypes.list.filter((n: { id: string }) => ids.indexOf(n.id) >= 0),
      slices: initialValue.map((n: { __inputname: string }, index: number) => ({
        ...stores.ContentTypes.items.get(n.__inputname),
        index,
      })),
    });
  }

  public onRemoveClick = (e: React.MouseEvent<HTMLElement>) => {
    const index = Number(e.currentTarget.dataset.index);
    const slices = this.state.slices.slice(0);
    slices[index] = null;
    this.setState({ slices });
  };

  public onMoveUpClick = (e: React.MouseEvent<HTMLElement>) => {
    const index = Number(e.currentTarget.dataset.index);
    const slices = this.state.slices.slice(0);
    if (index > 0) {
      const tmp = slices[index - 1];
      slices[index - 1] = slices[index];
      slices[index] = tmp;
    }
    this.setState({ slices });
  };

  public onMoveDownClick = (e: React.MouseEvent<HTMLElement>) => {
    const index = Number(e.currentTarget.dataset.index);
    const slices = this.state.slices.slice(0);
    if (slices.length - 1 > index) {
      const tmp = slices[index + 1];
      slices[index + 1] = slices[index];
      slices[index] = tmp;
    }
    this.setState({ slices });
  };

  public onMenuClick = async (e: { key: string }) => {
    const item = this.props.stores.ContentTypes.items.get(e.key);
    const slices = this.state.slices.slice(0);
    slices.push({ ...item, index: slices.length });
    this.setState({ slices });
  };

  public renderField = (field: any, index: number) => {
    const initialValue = this.props.initialValue || [];

    return this.props.renderField({
      ...this.props,
      field,
      initialValue: get(initialValue, `${index}.${field.name}`, ''),
      path: `${this.props.path}.${index}.${field.name}`,
    } as any);
  };

  public render() {
    const { field, form, path } = this.props;
    const menu = (
      <Menu onClick={this.onMenuClick}>
        {this.state.contentTypes.map(item => (
          <Menu.Item key={item.id}>{item.title}</Menu.Item>
        ))}
      </Menu>
    );

    return (
      <div className="prime-slice">
        <div className="prime-slice-spacer-top" />
        <div className="ant-form-item-label">
          <label title={field.title}>{field.title}</label>
        </div>
        {this.state.slices.map((slice, idx) => {
          if (!slice || !slice.id) {
            return null;
          }
          const { index } = slice as any;

          return (
            <Card key={`${slice.id}_${index}`} className="prime-slice-item">
              <div className="prime-slice-item-actions">
                <Icon
                  className={`prime-slice-item-button ${idx === 0 ? 'disabled' : ''}`}
                  type="up"
                  data-index={idx}
                  onClick={this.onMoveUpClick}
                />
                <Icon
                  className={`prime-slice-item-button ${
                    idx === this.state.slices.length - 1 ? 'disabled' : ''
                  }`}
                  type="down"
                  data-index={idx}
                  onClick={this.onMoveDownClick}
                />
                <Icon
                  className="prime-slice-item-button"
                  type="minus"
                  data-index={index}
                  onClick={this.onRemoveClick}
                />
              </div>
              {form.getFieldDecorator(`${path}.${index}.__index`, {
                initialValue: idx,
              })(<input type="hidden" />)}
              {form.getFieldDecorator(`${path}.${index}.__inputname`, {
                initialValue: slice.id,
              })(<input type="hidden" />)}
              {slice.schema.fields.filter(noChildren).map((f: any) => this.renderField(f, index))}
            </Card>
          );
        })}
        <div style={{ textAlign: 'center' }}>
          <Dropdown placement="bottomCenter" overlay={menu} trigger={['click']}>
            <Button
              size="large"
              shape="circle"
              // block={true}
              icon="plus"
              className="prime-slice-add"
            />
          </Dropdown>
        </div>
        <div className="prime-slice-spacer-bottom" />
      </div>
    );
  }
}
