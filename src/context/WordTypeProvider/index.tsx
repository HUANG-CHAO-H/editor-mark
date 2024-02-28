import {ReactNode, useContext, useMemo, useRef, useState} from "react";
import type {FormApi} from "@douyinfe/semi-ui/lib/es/form";
import {Button, Form, Modal, Toast, Tree } from "@douyinfe/semi-ui";
import {TreeNodeData} from "@douyinfe/semi-ui/lib/es/tree/interface";
import {
  IconArrowDown,
  IconArrowUp,
  IconClose,
  IconSetting,
  IconPlus,
} from "@douyinfe/semi-icons";

import { createContext } from "../../utils";
import { formatWordTypeInfo, WordTypeInfo, wordTypeQuery } from "../../models";
import { WordTypeItem } from "../../components/WordTypeItem";
import { FormColorSelect } from "../../components/ColorSelect";
import { DataAnalyseModal } from './DataAnalyseModal';

export interface IWordTypeContext {
  // word type 列表
  list: WordTypeInfo[];
  /**
   * 唤起创建type对话框
   * @param info  新建时的初始化数据
   */
  createModal: (info?: Partial<WordTypeInfo>, parentIndex?: number) => void;
  /**
   * 唤起更新type对话框
   * @param index 要更新的元素的索引
   */
  updateModal: (index: number, parentIndex?: number) => void;
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
    createModal(info?: Partial<WordTypeInfo>, parentIndex?: number) {
      setWordTypeModalInfo({
        type: 'create',
        parentIndex,
        data: formatWordTypeInfo(info || {
          typeKey: Date.now(),
          color: 'black',
        }),
      })
    },
    updateModal(index: number, parentIndex?: number) {
      if (index < 0) {
        return false;
      } else if (index >= list.length) {
        return false;
      }
      setWordTypeModalInfo({
        type: 'edit',
        index,
        parentIndex,
        data: parentIndex === undefined ? list[index] : list[parentIndex].children![index]
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
      const time = new Date();
      const timeString = `${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()}`;
      a.download = `元话语分类配置-${timeString}.json`;
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
  const [modalInfo, setModalInfo] = useState<{ type: 'create' | 'edit', index?: number, parentIndex?: number, data: WordTypeInfo }>();
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
              wordTypeQuery.run('push', formatV, modalInfo.parentIndex);
              setModalInfo(undefined);
            } else if (modalInfo.type === 'edit') {
              const formatV = formatWordTypeInfo(values);
              wordTypeQuery.run('update', modalInfo.index!, formatV, modalInfo.parentIndex);
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
              {
                validator: (_, v: string) => !list.find(l => l.typeKey === `WTK${v}` || l.children?.find(v => v.typeKey === `WTK${v}`)),
                message: 'typeKey已存在',
              },
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
    return translateTreeData(list, wordTypeContext);
    function translateTreeData(source: WordTypeInfo[], wordTypeContext: IWordTypeContext, parentIndex?: number) {
      const array: (TreeNodeData & WordTypeInfo)[] = [];
      for (let i = 0; i < source.length; i++) {
        const v = source[i];
        array.push({
          ...v,
          key: v.typeKey,
          label: (
            <WordTypeItem
              value={v}
              opArray={[
                parentIndex ? undefined : {
                  key: '新增',
                  ariaLabel: '新增',
                  icon: <IconPlus />,
                  onClick: () => wordTypeContext.createModal(undefined, i),
                },
                i <= 0 ? undefined : {
                  key: '上移',
                  ariaLabel: '上移',
                  icon: <IconArrowUp />,
                  onClick: () => wordTypeQuery.run('toFront', i, parentIndex),
                },
                i >= source.length - 1 ? undefined : {
                  key: '下移',
                  ariaLabel: '下移',
                  icon: <IconArrowDown />,
                  onClick: () => wordTypeQuery.run('toEnd', i, parentIndex),
                },
                {
                  key: '设置',
                  ariaLabel: '设置',
                  icon: <IconSetting />,
                  onClick: () => wordTypeContext.updateModal(i, parentIndex),
                },
                {
                  key: '删除',
                  ariaLabel: '删除',
                  icon: <IconClose />,
                  onClick: () => Modal.confirm({
                    title: `确认删除 ${v.name} ?`,
                    centered: true,
                    onOk: () => void wordTypeQuery.run('delete', i, parentIndex),
                  }),
                },
              ]}
            />
          ),
          isLeaf: !v.children,
          children: v.children ? translateTreeData(v.children, wordTypeContext, i) : undefined,
        });
      }
      return array;
    }
  }, [list, wordTypeContext]);
  return {
    settingVisible,
    setSettingVisible,
    el: (
      <Modal
        visible={settingVisible}
        closeOnEsc={true}
        centered={true}
        title={'元话语分类 设置'}
        width={'50vw'}
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
          expandAction={'doubleClick'}
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