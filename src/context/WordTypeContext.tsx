import {CSSProperties, ReactNode, useContext, useMemo, useRef, useState} from "react";
import cloneDeep from 'lodash/cloneDeep';
import type {FormApi} from "@douyinfe/semi-ui/lib/es/form";
import {Button, Form, Modal, Toast, Tree, Table, Popover} from "@douyinfe/semi-ui";
import {TreeNodeData} from "@douyinfe/semi-ui/lib/es/tree/interface";
import {IconArrowDown, IconArrowUp, IconClose, IconSetting} from "@douyinfe/semi-icons";
import type {ColumnProps} from "@douyinfe/semi-ui/lib/es/table/interface";
import type {Ops} from "@editor-kit/delta/dist/interface";

import {createContext} from "../utils";
import {formatWordTypeInfo, WordTypeInfo, wordTypeQuery} from "../models";
import {WordTypeItem} from "../components/WordTypeItem";
import {FormColorSelect} from "../components/ColorSelect";
import {useEditorContext} from "./EditorContext.tsx";

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
  // 数据统计与分析
  dataAnalyse: () => void;
}

export const WordTypeContext = createContext<IWordTypeContext>(undefined, 'WordTypeContext');
export const useWordTypeContext = () => useContext(WordTypeContext);

export function WordTypeContextProvider(props: { children?: ReactNode }) {
  const list = wordTypeQuery.useQuery().data!;
  const aRef = useRef<HTMLAnchorElement>(null);
  const [analyseModal, setAnalyseModal] = useState(false);

  const { inputRef, el: inputEl } = useDownloadFile();
  const { setWordTypeModalInfo, el: wordTypeModalEl } = useWordTypeInfoModal(list);


  const contextValue = useMemo<IWordTypeContext>(() => ({
    list,
    createModal(info?: Partial<WordTypeInfo>) {
      setWordTypeModalInfo({
        type: 'create',
        data: formatWordTypeInfo(info || {
          typeKey: Date.now(),
          color: 'black',
        }),
      })
    },
    updateModal(index: number) {
      if (index < 0) {
        return false;
      } else if (index >= list.length) {
        return false;
      }
      setWordTypeModalInfo({
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
    dataAnalyse: () => setAnalyseModal(true),
  }), [inputRef, list, setWordTypeModalInfo]);

  const { setSettingVisible, el: wordTypeSettingEl } = useWordTypeSetting(list, contextValue);

  return (
    <WordTypeContext.Provider value={contextValue}>
      {props.children}
      <a ref={aRef} />
      {inputEl}
      {wordTypeModalEl}
      {wordTypeSettingEl}
      <DataAnalyseModal visible={analyseModal} setVisible={setAnalyseModal} />
    </WordTypeContext.Provider>
  );
}

function useDownloadFile() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileKey, setFileKey] = useState(Number.MIN_SAFE_INTEGER);
  return {
    inputRef,
    fileKey,
    setFileKey,
    el: (
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
    ),
  }
}

function useWordTypeInfoModal(list: WordTypeInfo[]) {
  const [modalInfo, setModalInfo] = useState<{ type: 'create' | 'edit', data: WordTypeInfo }>();
  const [formApi, setFormApi] = useState<FormApi>();
  return {
    wordTypeModalInfo: modalInfo,
    setWordTypeModalInfo: setModalInfo,
    el: (
      <Modal
        visible={Boolean(modalInfo)}
        closeOnEsc={true}
        centered={true}
        title={modalInfo?.type === 'create' ? '新建' : `${modalInfo?.data?.name || ''} 设置`}
        onOk={() => {
          if (!formApi || !modalInfo?.type) return;
          formApi.validate().then(values => {
            if (modalInfo.type === 'create') {
              const formatV = formatWordTypeInfo({
                ...values,
                typeKey: 'WTK' + (values.typeKey || ''),
              });
              wordTypeQuery.run('push', formatV);
              setModalInfo(undefined);
            } else if (modalInfo.type === 'edit') {
              const formatV = formatWordTypeInfo(values);
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
            addonBefore={modalInfo?.type === 'create' ? 'WTK' : undefined}
            disabled={modalInfo?.type !== 'create'}
            rules={modalInfo?.type !== 'create' ? undefined : [
              { required: true },
              { validator: (_, v: string) => /^[0-9a-zA-Z]+$/.test(v), message: 'typeKey只能由数字和大小写字母构成' },
              { validator: (_, v: string) => !list.find(l => l.typeKey === `WTK${v}`), message: 'typeKey已存在' },
            ]}
          />
          <Form.Input label="名称" field="name" />
          <div style={{ display: 'flex' }}>
            <div style={{ width: '50%', display: 'flex', justifyContent: 'center' }}>
              <FormColorSelect label="字体颜色" field="color" />
            </div>
            <div style={{ width: '50%', display: 'flex', justifyContent: 'center' }}>
              <FormColorSelect label="背景颜色" field="backgroundColor" />
            </div>
          </div>
          <Form.TextArea label="描述" field="description" />
        </Form>
      </Modal>
    ),
  }
}

function useWordTypeSetting(list: WordTypeInfo[], wordTypeContext: IWordTypeContext) {
  const [settingVisible, setSettingVisible] = useState(false);
  const treeData = useMemo(() => {
    return list.map<TreeNodeData>(
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
  }, [list, wordTypeContext]);
  return {
    settingVisible,
    setSettingVisible,
    el: (
      <Modal
        visible={settingVisible}
        closeOnEsc={true}
        centered={true}
        title={'Word 设置'}
        onOk={() => {

        }}
        onCancel={() => setSettingVisible(false)}
        footer={
          <Button
            theme="solid"
            type="primary"
            style={{ width: '100%', margin: 0 }}
            block={true}
            onClick={() => wordTypeContext.createModal()}
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
    )
  };
}

function DataAnalyseModal(props: {visible: boolean, setVisible: (value: boolean) => void;}) {
  const { visible, setVisible } = props;
  const list = wordTypeQuery.useQuery().data!;
  const { editor } = useEditorContext();
  const analyse = useMemo(() => {
    const analyseRecord: Record<string, { count: number, word: string[] }> = {};
    if (!visible || !editor) {
      return analyseRecord;
    }
    const opArray: Ops = cloneDeep(editor.getContent().deltas[0]?.ops || []);
    for (let i = 0; i < opArray.length; i++) {
      const attributes = opArray[i].attributes || {};
      const keys = Object.keys(attributes).filter(k => k.startsWith('WTK'));
      for (const key of keys) {
        const value = attributes[key];
        if (!value) {
          continue;
        }
        const rec = analyseRecord[key] || { count: 0, word: [] };
        analyseRecord[key] = rec;
        let word = opArray[i].insert as string;
        // 检查后面是否还存在相同的标记
        for (let j = i + 1; j < opArray.length; j++) {
          if (!opArray[j].attributes || opArray[j].attributes![key] !== value) {
            break;
          }
          word += opArray[j].insert || '';
          delete opArray[j].attributes![key];
        }
        rec.count++;
        rec.word.push(word);
      }
    }
    return analyseRecord;
  }, [visible, editor]);

  const [effectType, allCount] = useMemo(() => {
    let _typeCount = 0;
    let _allCount = 0;
    for (const value of Object.values(analyse)) {
      if (value.count) {
        _typeCount++;
        _allCount += value.count;
      }
    }
    return [_typeCount, _allCount] as const;
  }, [analyse]);

  const columns = useMemo<ColumnProps<WordTypeInfo>[]>(() => [
    {
      title: '名称',
      dataIndex: 'name',
      width: 100,
      render: (text: string, record: WordTypeInfo) => (
        <div style={{ textAlign: 'center', backgroundColor: record.backgroundColor, color: record.color}}>
          {text}
        </div>
      ),
    },
    {
      title: 'typeKey',
      dataIndex: 'typeKey',
      width: 100,
    },
    {
      title: '描述',
      dataIndex: 'description',
      render: (text: string, record: WordTypeInfo) => (
        <div style={{ backgroundColor: record.backgroundColor, color: record.color}}>
          {text}
        </div>
      ),
    },
    {
      title: '频次占比',
      dataIndex: '$percent$',
      width: 100,
      render: (_, record: WordTypeInfo) => {
        const info = analyse[record.typeKey];
        return (
          <div style={{ backgroundColor: record.backgroundColor, color: record.color, textAlign: 'center' }}>
            {info ? (info.count / allCount * 100).toFixed(2) + '%' : '0'}
          </div>
        );
      },
    },
    {
      title: '频次统计',
      dataIndex: '$count$',
      width: 100,
      render: (_, record: WordTypeInfo) => {
        const info = analyse[record.typeKey];
        if (!info?.count) {
          return <div style={{textAlign: 'center'}}>0</div>
        }
        const colorStyle: CSSProperties = {
          display: 'inline-block',
          backgroundColor: record.backgroundColor,
          color: record.color,
          padding: 5,
        }
        const style: CSSProperties = { display: 'inline-block', padding: 5 }
        return (
          <Popover
            style={{ maxWidth: '50vw', maxHeight: '50vh', overflowY: 'auto' }}
            position="bottomRight"
            content={() => (
              <div style={{padding: 10}}>
                {info.word.map((value, index) => (
                  <div style={index % 2 ? style : colorStyle}>{value}</div>
                ))}
              </div>
            )}
          >
            <div style={{color: 'blue', textAlign: 'center', fontWeight: 'bolder'}}>{info.count}</div>
          </Popover>
        )
      },
    },
  ], [analyse, allCount]);
  return (
    <Modal
      visible={visible}
      closeOnEsc={true}
      centered={true}
      title={
        <span>
          数据统计(有效类型:&nbsp;&nbsp;
          <span style={{ color: 'green'}}>{effectType}</span>
          ,总数统计:&nbsp;&nbsp;
          <span style={{ color: 'green'}}>{allCount}</span>
          )
        </span>
      }
      width={window.innerWidth * 0.8}
      onCancel={() => setVisible(false)}
      footer={<span />}
    >
      <Table columns={columns} dataSource={list} scroll={{ x: window.innerWidth * 0.6, y: window.innerHeight * 0.6 }}/>
    </Modal>
  )
}
