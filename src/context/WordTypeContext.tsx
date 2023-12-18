import {ReactNode, useContext, useMemo, useState} from "react";
import {createContext} from "../utils";
import {formatWordTypeInfo, WordTypeInfo} from "../models";
import {Form, Modal, Popover, withField} from "@douyinfe/semi-ui";
import {SketchPicker} from "react-color";
import type {FormApi} from "@douyinfe/semi-ui/lib/es/form";

export interface IWordTypeContext {
  list: WordTypeInfo[];
  // 获取目标key所对应的type在数组中的位置(索引)
  getIndexByKey: (key: string) => number;
  /**
   * 向前移动
   * @param index 要操作的元素index
   */
  toFront: (index: number) => void;
  /**
   * 向后移动
   * @param index 要操作的元素index
   */
  toEnd: (index: number) => void;
  /**
   * 更新元素数据
   * @param index 要更新的元素
   * @param item  要更新的内容
   */
  update: (index: number, item: Partial<WordTypeInfo>) => void;
  /**
   * 删除元素
   * @param index 要追加的元素
   */
  delete: (index: number) => void;
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

const testV: WordTypeInfo[] = [
  { typeKey: '01', name: '测试-01', color: 'yellow', backGroundColor: '', description: '这是一段测试' },
  { typeKey: '02', name: '测试-02', color: 'green', backGroundColor: '', description: '这是一段测试' },
  { typeKey: '03', name: '测试-03', color: 'yellow', backGroundColor: '', description: '这是一段测试' },
  { typeKey: '04', name: '测试-04', color: 'green', backGroundColor: '', description: '这是一段测试' },
];

export function WordTypeContextProvider(props: { children?: ReactNode }) {
  const [list, setList] = useState<WordTypeInfo[]>(testV);

  const contextValue = useMemo<IWordTypeContext>(() => ({
    list,
    getIndexByKey: (key: string) => list.findIndex(v => v.typeKey === key),
    toFront(index: number) {
      setList(oldV => {
        if (index <= 0) {
          return oldV;
        } else if (index >= oldV.length) {
          return oldV;
        }
        const arr = [...oldV];
        const left = arr[index - 1];
        arr[index - 1] = arr[index];
        arr[index] = left;
        return arr;
      });
    },
    toEnd(index: number) {
      setList(oldV => {
        if (index < 0) {
          return oldV;
        } else if (index >= oldV.length - 1) {
          return oldV;
        }
        const arr = [...oldV];
        const right = arr[index + 1];
        arr[index + 1] = arr[index];
        arr[index] = right;
        return arr;
      });
    },
    push(info: WordTypeInfo) {
      setList(oldV => [...oldV, info]);
    },
    update(index: number, item: Partial<WordTypeInfo>) {
      setList(oldV => {
        if (index < 0) {
          return oldV;
        } else if (index >= oldV.length) {
          return oldV;
        }
        const arr = [...oldV];
        arr[index] = formatWordTypeInfo({
          ...arr[index],
          ...item,
        });
        return arr;
      });
    },
    delete(index: number) {
      setList(oldV => {
        if (index < 0) {
          return oldV;
        } else if (index >= oldV.length) {
          return oldV;
        }
        const arr = [...oldV];
        arr.splice(index, 1);
        return arr;
      });
    },
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

  const [formApi, setFormApi] = useState<FormApi>();
  const [modalInfo, setModalInfo] = useState<{ type: 'create' | 'edit', data: WordTypeInfo }>();

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
              setList(oldV => [...oldV, formatV]);
              setModalInfo(undefined);
            } else if (type === 'edit') {
              contextValue.update(contextValue.getIndexByKey(formatV.typeKey), formatV);
              setModalInfo(undefined);
            }
          });
        }}
        onCancel={() => setModalInfo(undefined)}>
        <Form key={modalInfo?.type || ''} initValues={modalInfo?.data} getFormApi={setFormApi}>
          <Form.Input label="type key" disabled={modalInfo?.type !== 'create'} field="typeKey" />
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
