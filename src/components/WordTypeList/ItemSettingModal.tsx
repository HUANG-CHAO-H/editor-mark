import {useMemo, useState} from "react";
import type {FormApi} from "@douyinfe/semi-ui/lib/es/form";
import {Form, Modal, Popover, withField} from "@douyinfe/semi-ui";
import { SketchPicker } from 'react-color';
import {formatWordTypeInfo, WordTypeInfo} from "../../models";

export interface ItemSettingModalProps extends WordTypeInfo {
  // 可见性
  visible: boolean;
  // visible变化后的回调函数
  setVisible: (value: boolean) => void;
  // 是否是新建场景
  isCreate?: boolean;
  // 数值变化后的回调函数
  onChange: (info: WordTypeInfo) => void;
}

export function ItemSettingModal(props: ItemSettingModalProps) {
  const { visible, setVisible, isCreate = false } = props;
  const [formApi, setFormApi] = useState<FormApi>();
  const initValue = useMemo<WordTypeInfo>(() => ({
    typeKey: props.typeKey,
    name: props.name,
    color: props.color,
    backGroundColor: props.backGroundColor,
    description: props.description,
  }), [props.backGroundColor, props.color, props.description, props.name, props.typeKey]);
  return (
    <Modal
      visible={visible}
      closeOnEsc={true}
      centered={true}
      title={isCreate ? '新建' : `${props.name} 设置`}
      onOk={() => {
        if (!formApi) return;
        formApi.validate().then(values => {
          props.onChange(formatWordTypeInfo(values));
          setVisible(false);
        });
      }}
      onCancel={() => setVisible(false)}>
      <Form initValues={initValue} getFormApi={setFormApi}>
        <Form.Input label="type key" disabled={!props.isCreate} field="typeKey" />
        <Form.Input label="名称" field="name" />
        <FormColorSelect label="字体颜色" field="color" />
        <FormColorSelect label="背景颜色" field="backGroundColor" />
        <Form.TextArea label="描述" field="description" />
      </Form>
    </Modal>
  );
}

function ColorSelect(props: { value?: string, onChange?: (value: string) => void }) {
  return (
    <Popover
      trigger="click"
      position="right"
      content={<SketchPicker color={props.value} onChange={v => props.onChange?.(v.hex)} />}
    >
      <div style={{
        backgroundColor: props.value,
        width: 60,
        height: '100%',
        minHeight: 30,
        borderRadius: 5,
        borderStyle: "outset"
      }} />
    </Popover>
  );
}
const FormColorSelect = withField(ColorSelect);