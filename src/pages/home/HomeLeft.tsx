import {useMemo} from "react";
import { Tree } from '@douyinfe/semi-ui';
import { TreeNodeData } from '@douyinfe/semi-ui/lib/es/tree';
import {WordTypeItem} from '../../components/WordTypeItem';
import {useWordTypeContext, IWordTypeContext} from "../../context";
import {WordTypeInfo, wordTypeQuery} from "../../models";
import {IconEyeClosed, IconEyeOpened, IconSetting} from "@douyinfe/semi-icons";

export function HomeLeft() {
  const wordTypeContext = useWordTypeContext();
  const treeData = useMemo<TreeNodeData[]>(
    () => translateTreeData(wordTypeContext.list, wordTypeContext),
    [wordTypeContext],
  );
  return (
    <div style={{ height: '100%', borderRightStyle: 'groove', overflowY: 'auto' }}>
      <Tree treeData={treeData}/>
    </div>
  )
}

function translateTreeData(source: WordTypeInfo[], wordTypeContext: IWordTypeContext, parentIndex?: number) {
  const array: (TreeNodeData & WordTypeInfo)[] = [];
  for (let i = 0; i < source.length; i++) {
    const v = source[i];
    array.push({
      ...v,
      key: v.typeKey,
      label: (
        <WordTypeItem
          key={v.typeKey}
          value={v}
          opArray={[
            {
              key: '展示',
              ariaLabel: '展示',
              icon: <IconEyeOpened />,
              onClick: () => wordTypeQuery.run('hide', i, parentIndex),
              hidden: Boolean(v.hidden), // 展示按钮只有在当前word被隐藏时才显示
            },
            {
              key: '隐藏',
              ariaLabel: '隐藏',
              icon: <IconEyeClosed />,
              onClick: () => wordTypeQuery.run('show', i, parentIndex),
              hidden: !v.hidden,  // 隐藏按钮只有在当前word被展示时才显示
            },
            {
              key: '设置',
              ariaLabel: '设置',
              icon: <IconSetting />,
              onClick: () => wordTypeContext.updateModal(i, parentIndex),
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