import {CSSProperties, useMemo} from "react";
import type {Ops} from "@editor-kit/delta/dist/interface";
import cloneDeep from "lodash/cloneDeep";
import {Modal, Popover, Table, TextArea, Toast} from "@douyinfe/semi-ui";
import type {ColumnProps} from "@douyinfe/semi-ui/lib/es/table/interface";
import {IconCopy} from "@douyinfe/semi-icons";
import {WordTypeInfo, wordTypeQuery} from "../../models";
import {useEditorContext} from "../EditorContext.tsx";

import './style.less';

export function DataAnalyseModal(props: {visible: boolean, setVisible: (value: boolean) => void;}) {
  const { visible, setVisible } = props;
  const list = wordTypeQuery.useQuery().data!;
  const { editor } = useEditorContext();
  const analyse = useMemo(() => {
    const map = new Map<string, {count: number; word: string[]}>();
    if (!visible || !editor) {
      return map;
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
        let rec = map.get(key);
        if (!rec) {
          map.set(key, rec = { count: 0, word: [] });
        }
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
    return map;
  }, [visible, editor]);

  const columns = useMemo<ColumnProps<WordTypeInfo>[]>(() => createColumns(list, analyse), [list, analyse]);
  return (
    <Modal
      visible={visible}
      closeOnEsc={true}
      centered={true}
      title={'数据统计'}
      width={window.innerWidth * 0.8}
      onCancel={() => setVisible(false)}
      footer={<span />}
    >
      <Table
        columns={columns}
        dataSource={list}
        scroll={{ x: window.innerWidth * 0.6, y: window.innerHeight * 0.6 }}
        pagination={false}
        rowKey={'typeKey'}
        hideExpandedColumn={false}
        expandedRowRender={(record?: WordTypeInfo) => record ? <ExpandedRow record={record} docAnalyse={analyse} /> : null}
        className={'data-analyse-table'}
        childrenRecordName={''}
        expandRowByClick={true}
      />
    </Modal>
  )
}

function ExpandedRow({ record, docAnalyse }: {
  record: WordTypeInfo,
  docAnalyse: Map<string, {count: number, word: string[]}>,
}) {
  const columns = useMemo(
    () => createColumns(record.children || [], docAnalyse),
    [record.children, docAnalyse],
  );
  return (
    <Table
      columns={columns}
      dataSource={record.children}
      pagination={false}
    />
  );
}

function createColumns(
  list: WordTypeInfo[],
  docAnalyse: Map<string, {count: number, word: string[]}>,
): ColumnProps<WordTypeInfo>[] {
  let effectType = 0;
  let allCount = 0;
  const keySet = new Set([...list.map(v => v.typeKey)]);
  for (const [key, value] of docAnalyse) {
    if (keySet.has(key) && value.count) {
      effectType++;
      allCount += value.count;
    }
  }

  function onCopy(key: 'name' | '$count$') {
    let text = '';
    if (key === 'name') {
      text = list.map(v => v.name).join('\n');
    } else if (key === '$count$') {
      text = list.map(v => docAnalyse.get(v.typeKey)?.count || 0).join('\n');
    }
    if (!text) {
      Toast.warning('内容为空');
      return;
    }
    Modal.info({
      title: '手动复制内容到剪切板',
      width: 500,
      content: <TextArea value={text} autosize={{ minRows: 1, maxRows: 10 }} />,
    });
  }
  return [
    {
      title: (
        <div style={{display: 'flex', alignItems: 'center' }}>
          名称(有效类型: <span style={{ color: 'green'}}>{effectType}</span>)
          <IconCopy style={{cursor: 'pointer', color: 'blue' }} onClick={() => onCopy('name')}/>
        </div>
      ),
      dataIndex: 'name',
      width: 170,
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
      title: (
        <div style={{display: 'flex', alignItems: 'center' }}>
          频次统计(共<span style={{ color: 'green'}}>{allCount}</span>)
          <IconCopy style={{ cursor: 'pointer', color: 'blue' }} onClick={() => onCopy('$count$')}/>
        </div>
      ),
      dataIndex: '$count$',
      width: 200,
      render: (_, record: WordTypeInfo) => {
        const info = docAnalyse.get(record.typeKey);
        if (!info?.count) {
          return <div style={{textAlign: 'center'}}>0</div>
        }
        const colorStyle: CSSProperties = {
          display: 'inline-block',
          backgroundColor: record.backgroundColor,
          color: record.color,
          padding: 5,
        }
        const style: CSSProperties = {display: 'inline-block', padding: 5}
        return (
          <Popover
            style={{maxWidth: '50vw', maxHeight: '50vh', overflowY: 'auto'}}
            position="bottomLeft"
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
    {
      title: '频次占比',
      dataIndex: '$percent$',
      width: 150,
      render: (_, record: WordTypeInfo) => {
        const info = docAnalyse.get(record.typeKey);
        return (
          <div style={{ backgroundColor: record.backgroundColor, color: record.color, textAlign: 'center' }}>
            {info ? (info.count / allCount * 100).toFixed(2) + '%' : '0'}
          </div>
        );
      },
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
  ];
}
