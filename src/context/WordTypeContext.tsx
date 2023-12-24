import {ReactNode, useContext, useMemo, useState} from "react";
import {SketchPicker} from "react-color";
import type {FormApi} from "@douyinfe/semi-ui/lib/es/form";
import {Form, Modal, Popover, withField} from "@douyinfe/semi-ui";
import {createContext} from "../utils";
import {formatWordTypeInfo, WordTypeInfo, wordTypeQuery} from "../models";

export interface IWordTypeContext {
  // word type 列表
  list: WordTypeInfo[];
  /**
   * 唤起创建type对话框
   * @param info  新建时的初始化数据
   */
  createModal: (info?: Partial<WordTypeInfo>) => void;
  /**
   * 唤起更新type对话框
   * @param index 要更新的元素的索引
   */
  updateModal: (index: number) => void;
}

export const WordTypeContext = createContext<IWordTypeContext>(undefined, 'WordTypeContext');
export const useWordTypeContext = () => useContext(WordTypeContext);

export function WordTypeContextProvider(props: { children?: ReactNode }) {
  const list = wordTypeQuery.useQuery().data!;
  const [formApi, setFormApi] = useState<FormApi>();
  const [modalInfo, setModalInfo] = useState<{ type: 'create' | 'edit', data: WordTypeInfo }>();

  const contextValue = useMemo<IWordTypeContext>(() => ({
    list,
    createModal(info?: Partial<WordTypeInfo>) {
      setModalInfo({
        type: 'create',
        data: formatWordTypeInfo(info || {}),
      })
    },
    updateModal(index: number) {
      if (index < 0) {
        return false;
      } else if (index >= list.length) {
        return false;
      }
      setModalInfo({
        type: 'edit',
        data: list[index]
      });
      return true;
    }
  }), [list]);

  return (
    <WordTypeContext.Provider value={contextValue}>
      {props.children}
      <Modal
        visible={Boolean(modalInfo)}
        closeOnEsc={true}
        centered={true}
        title={modalInfo?.type === 'create' ? '新建' : `${modalInfo?.data.name || ''} 设置`}
        onOk={() => {
          if (!formApi || !modalInfo) return;
          const { type } = modalInfo;
          formApi.validate().then(values => {
            const formatV = formatWordTypeInfo(values);
            if (type === 'create') {
              wordTypeQuery.run('push', formatV);
              setModalInfo(undefined);
            } else if (type === 'edit') {
              wordTypeQuery.run('update', wordTypeQuery.run('getIndexByKey', formatV.typeKey), formatV);
              setModalInfo(undefined);
            }
          });
        }}
        onCancel={() => setModalInfo(undefined)}>
        <Form key={modalInfo?.type || ''} initValues={modalInfo?.data} getFormApi={setFormApi}>
          <Form.Input
            field="typeKey"
            label="type key"
            disabled={modalInfo?.type !== 'create'}
            rules={[
              { validator: (_, v: string) => /^[0-9a-zA-Z]+$/.test(v), message: 'typeKey只能由数字和大小写字母构成' },
            ]}
          />
          <Form.Input label="名称" field="name" />
          <FormColorSelect label="字体颜色" field="color" />
          <FormColorSelect label="背景颜色" field="backGroundColor" />
          <Form.TextArea label="描述" field="description" />
        </Form>
      </Modal>
    </WordTypeContext.Provider>
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
