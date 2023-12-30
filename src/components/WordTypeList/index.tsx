import {Button, Divider} from "@douyinfe/semi-ui";
import {
  IconDisc,
  IconSetting,
  IconArrowUp,
  IconArrowDown,
  IconClose,
  IconEyeOpened,
  IconEyeClosed,
} from "@douyinfe/semi-icons";
import {IContentState} from "@editor-kit/core";
import {WordTypeInfo, wordTypeQuery} from "../../models";
import {useEditorContext, useWordTypeContext} from "../../context";
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
              wordTypeQuery.run('toFront', index);
            } else if (type === 'down') {
              wordTypeQuery.run('toEnd', index);
            } else if (type === 'delete') {
              wordTypeQuery.run('delete', index);
            } else if (type === 'hide') {
              wordTypeQuery.run('hide', index);
            } else if (type === 'show') {
              wordTypeQuery.run('show', index);
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
  operation?: (type: 'edit' | 'up' | 'down' | 'delete' | 'hide' | 'show') => void;
}

export function WordTypeItem(props: WordTypeItemProps) {
  const { value: wordTypeInfo } = props;
  const { editor } = useEditorContext();
  return (
    <>
      <div
        className="word-type-item"
        style={{color: props.value.color || undefined, backgroundColor: props.value.backgroundColor}}
      >
        <div
          className="word-type-item-label"
          onClick={event => {
            event.stopPropagation();
            if (!editor || !wordTypeInfo?.typeKey) {
              return;
            }
            const state: IContentState = editor.getContentState();
            const pos = editor.selection.getSelection();
            const attr = state.getAttributes(pos.start, pos.end).toMap();
            // 有这个属性了, 那么就移除它
            if (attr[wordTypeInfo.typeKey]) {
              state.setAttributes(pos, {
                [wordTypeInfo.typeKey]: '',
              });
            } else {
              // 没有, 就添加
              state.setAttributes(pos, {
                [wordTypeInfo.typeKey]: 'true',
              });
            }
            editor.focus();
            editor.selection.setSelection(pos);
            console.info(state.getAttributes(pos.start, pos.end).toMap());
          }}
        >
          <IconDisc style={{opacity: props.selected ? undefined : 0}}/>&nbsp;
          <span>{props.value.name}</span>
        </div>
        <div className="word-type-item-operation">
          <Button
            theme="borderless"
            type="secondary"
            size="small"
            icon={wordTypeInfo.hidden ? <IconEyeClosed /> : <IconEyeOpened />}
            aria-label="上移"
            onClick={() => props.operation?.(wordTypeInfo.hidden ? 'show' : 'hide')}
          />
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
