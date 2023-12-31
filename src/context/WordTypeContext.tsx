import {ReactNode, useContext, useMemo, useRef, useState} from "react";
import {SketchPicker} from "react-color";
import type {FormApi} from "@douyinfe/semi-ui/lib/es/form";
import {Button, Form, Modal, Popover, Toast, Tree, withField} from "@douyinfe/semi-ui";
import {TreeNodeData} from "@douyinfe/semi-ui/lib/es/tree/interface";
import noop from 'lodash/noop';

import {createContext} from "../utils";
import {formatWordTypeInfo, WordTypeInfo, wordTypeQuery} from "../models";
import {WordTypeItem} from "../components/WordTypeItem";
import {IconArrowDown, IconArrowUp, IconClose, IconSetting} from "@douyinfe/semi-icons";

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
  /**
   * 打开word设置弹窗
   */
  openWordSetting: () => void;
  // 打开配置
  openJSON: () => void;
  // 保存配置
  saveJSON: () => void;
}

export const WordTypeContext = createContext<IWordTypeContext>(undefined, 'WordTypeContext');
export const useWordTypeContext = () => useContext(WordTypeContext);

export function WordTypeContextProvider(props: { children?: ReactNode }) {
  const list = wordTypeQuery.useQuery().data!;
  const [settingVisible, setSettingVisible] = useState(false);
  const [modalInfo, setModalInfo] = useState<{ type: 'create' | 'edit', data: WordTypeInfo }>();
  const [fileKey, setFileKey] = useState(Number.MIN_SAFE_INTEGER);
  const inputRef = useRef<HTMLInputElement>(null);
  const aRef = useRef<HTMLAnchorElement>(null);

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
    },
    openWordSetting: () => setSettingVisible(true),
    openJSON: () => void inputRef.current?.click(),
    saveJSON: () => {
      const a = aRef.current;
      if (!a) {
        return;
      }
      const blob = new Blob([JSON.stringify(list)], { type: 'application/json;charset=utf-8'});
      a.href = URL.createObjectURL(blob);
      a.download = 'wordTypeConfig.json';
      a.click();
    },
  }), [list]);

  return (
    <WordTypeContext.Provider value={contextValue}>
      {props.children}
      <a ref={aRef} />
      <input
        key={fileKey}
        type="file"
        ref={inputRef}
        style={{display: 'none'}}
        accept="application/json"
        onChange={e => {
          const fileList = e.target.files;
          if (!fileList?.length) {
            return;
          }
          const info = fileList[0];
          const reader = new FileReader();
          reader.onload = () => {
            setFileKey(v => v + 1);
            const jsonStr: string = reader.result as string;
            console.log(info, jsonStr);
            try {
              const obj = JSON.parse(jsonStr);
              if (obj instanceof Array) {
                wordTypeQuery.setQueryData([], obj.map(v => formatWordTypeInfo(v || {})));
              } else {
                Toast.error('配置文件格式错误');
              }
            } catch (e) {
              console.error(e);
              Toast.error('文件解析失败, 配置文件格式错误');
            }
          };
          reader.readAsText(info);
        }}
      />
      <WordTypeInfoModal type={modalInfo?.type} data={modalInfo?.data} onClose={() => setModalInfo(undefined)}/>
      <WordTypeSetting visible={settingVisible} setVisible={setSettingVisible}/>
    </WordTypeContext.Provider>
  );
}

function WordTypeInfoModal(props: { type?: 'create' | 'edit', data?: WordTypeInfo, onClose?: () => void }) {
  const {type, data, onClose = noop} = props;
  const list = wordTypeQuery.useQuery().data!;
  const [formApi, setFormApi] = useState<FormApi>();
  return (
    <Modal
      visible={Boolean(type)}
      closeOnEsc={true}
      centered={true}
      title={type === 'create' ? '新建' : `${data?.name || ''} 设置`}
      onOk={() => {
        if (!formApi || !type) return;
        formApi.validate().then(values => {
          const formatV = formatWordTypeInfo(values);
          if (type === 'create') {
            wordTypeQuery.run('push', formatV);
            onClose();
          } else if (type === 'edit') {
            wordTypeQuery.run('update', wordTypeQuery.run('getIndexByKey', formatV.typeKey), formatV);
            onClose();
          }
        });
      }}
      onCancel={onClose}>
      <Form key={type || ''} initValues={data} getFormApi={setFormApi}>
        <Form.Input
          field="typeKey"
          label="type key"
          disabled={type !== 'create'}
          rules={ type !== 'create' ? undefined : [
            { validator: (_, v: string) => /^[0-9a-zA-Z]+$/.test(v), message: 'typeKey只能由数字和大小写字母构成' },
            { validator: (_, v: string) => !list.find(l => l.typeKey === v), message: 'typeKey已存在' },
          ]}
        />
        <Form.Input label="名称" field="name" />
        <FormColorSelect label="字体颜色" field="color" />
        <FormColorSelect label="背景颜色" field="backgroundColor" />
        <Form.TextArea label="描述" field="description" />
      </Form>
    </Modal>
  );
}

function WordTypeSetting(props: { visible: boolean; setVisible: (value: boolean) => void }) {
  const { visible, setVisible } = props;
  const wordTypeContext = useWordTypeContext();
  const queryList = wordTypeQuery.useQuery().data!;
  const treeData = useMemo(() => {
    return queryList.map<TreeNodeData>(
      (l: WordTypeInfo, index: number) => ({
        key: l.typeKey,
        value: l.typeKey,
        label: (
          <WordTypeItem
            value={l}
            opArray={[
              {
                key: '上移',
                ariaLabel: '上移',
                icon: <IconArrowUp />,
                onClick: () => wordTypeQuery.run('toFront', index),
              },
              {
                key: '下移',
                ariaLabel: '下移',
                icon: <IconArrowDown />,
                onClick: () => wordTypeQuery.run('toEnd', index),
              },
              {
                key: '设置',
                ariaLabel: '设置',
                icon: <IconSetting />,
                onClick: () => wordTypeContext.updateModal(index),
              },
              {
                key: '删除',
                ariaLabel: '删除',
                icon: <IconClose />,
                onClick: () => Modal.confirm({
                  title: `确认删除 ${l.name} ?`,
                  centered: true,
                  onOk: () => void wordTypeQuery.run('delete', index),
                }),
              },
            ]}
          />
        ),
      })
    );
  }, [queryList, wordTypeContext]);
  return (
    <Modal
      visible={visible}
      closeOnEsc={true}
      centered={true}
      title={'Word 设置'}
      onOk={() => {

      }}
      onCancel={() => setVisible(false)}
      footer={
        <Button
          theme="solid"
          type="primary"
          style={{ width: '100%', margin: 0 }}
          block={true}
          onClick={() => wordTypeContext.createModal({ color: 'black' })}
        >
          新增
        </Button>
      }
    >
      <Tree
        treeData={treeData}
        style={{
          width: '100%',
          maxHeight: '400px',
          border: '1px solid var(--semi-color-border)',
        }}
      />
    </Modal>
  );
}

function ColorSelect(props: { value?: string, onChange?: (value: string) => void }) {
  return (
    <Popover
      trigger="click"
      position="right"
      content={
        <SketchPicker
          color={props.value}
          disableAlpha={false}
          onChange={v => props.onChange?.(v.hex)}
        />
      }>
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
