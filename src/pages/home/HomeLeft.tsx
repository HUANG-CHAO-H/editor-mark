import {WordTypeItem} from '../../components/WordTypeItem';
import {useWordTypeContext} from "../../context";
import {useMemo} from "react";
import {WordTypeInfo, wordTypeQuery} from "../../models";
import {IconEyeClosed, IconEyeOpened, IconSetting} from "@douyinfe/semi-icons";

export function HomeLeft() {
  const wordTypeContext = useWordTypeContext();
  const list = useMemo(() => {
    return wordTypeContext.list.map((v: WordTypeInfo, index: number) => (
      <WordTypeItem
        key={v.typeKey}
        value={v}
        opArray={[
          {
            key: '展示',
            ariaLabel: '展示',
            icon: <IconEyeOpened />,
            onClick: () => wordTypeQuery.run('hide', index),
            hidden: Boolean(v.hidden), // 展示按钮只有在当前word被隐藏时才显示
          },
          {
            key: '隐藏',
            ariaLabel: '隐藏',
            icon: <IconEyeClosed />,
            onClick: () => wordTypeQuery.run('show', index),
            hidden: !v.hidden,  // 隐藏按钮只有在当前word被展示时才显示
          },
          {
            key: '设置',
            ariaLabel: '设置',
            icon: <IconSetting />,
            onClick: () => wordTypeContext.updateModal(index),
          },
        ]}
      />
    ));
  }, [wordTypeContext.list, wordTypeContext.updateModal])
  return (
    <div style={{ height: '100%', borderRightStyle: 'groove', overflowY: 'auto' }}>
      {list}
    </div>
  )
}