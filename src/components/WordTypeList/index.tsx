import {Button, Divider} from "@douyinfe/semi-ui";
import {IconDisc, IconSetting, IconArrowUp, IconArrowDown, IconClose} from "@douyinfe/semi-icons";
import {WordTypeInfo} from "../../models";
import {useWordTypeContext} from "../../context";
import './style.less';

export function WordTypeList() {
  const wordTypeContext = useWordTypeContext();
  return (
    <div>
      <Button
        theme="solid"
        type="primary"
        block={true}
        onClick={() => wordTypeContext.createModal({ color: 'black' })}
      >
        新增
      </Button>
      <Divider margin="5px" />
      {wordTypeContext.list.map((v: WordTypeInfo, index: number) => (
        <WordTypeItem
          key={v.typeKey}
          value={v}
          selected={v.typeKey === '04'}
          operation={type => {
            if (type === 'edit') {
              wordTypeContext.updateModal(index);
            } else if (type === 'up') {
              wordTypeContext.toFront(index);
            } else if (type === 'down') {
              wordTypeContext.toEnd(index);
            } else if (type === 'delete') {
              wordTypeContext.delete(index);
            }
          }}
        />
      ))}
    </div>
  )
}

export interface WordTypeItemProps {
  // 数据
  value: WordTypeInfo;
  // 选中状态
  selected?: boolean;
  // 针对type的操作
  operation?: (type: 'edit' | 'up' | 'down' | 'delete') => void;
}

export function WordTypeItem(props: WordTypeItemProps) {
  return (
    <>
      <div
        className="word-type-item"
        style={{color: props.value.color || undefined, backgroundColor: props.value.backGroundColor}}
      >
        <div className="word-type-item-label">
          <IconDisc style={{opacity: props.selected ? undefined : 0}}/>&nbsp;
          <span>{props.value.name}</span>
        </div>
        <div className="word-type-item-operation">
          <Button
            theme="borderless"
            type="secondary"
            size="small"
            icon={<IconArrowUp />}
            aria-label="上移"
            onClick={() => props.operation?.('up')}
          />
          <Button
            theme="borderless"
            type="secondary"
            size="small"
            icon={<IconArrowDown />}
            aria-label="下移"
            onClick={() => props.operation?.('down')}
          />
          <Button
            theme="borderless"
            type="primary"
            size="small"
            icon={<IconSetting />}
            aria-label="设置"
            onClick={() => props.operation?.('edit')}
          />
          <Button
            theme="borderless"
            type="warning"
            size="small"
            icon={<IconClose />}
            aria-label="删除"
            onClick={() => props.operation?.('delete')}
          />
        </div>
      </div>
    </>
  );
}
