import {ReactNode} from "react";
import {IContentState} from "@editor-kit/core";
import {Button} from "@douyinfe/semi-ui";
import {useEditorContext} from "../../context";
import {WordTypeInfo} from "../../models";

export interface OperationInfo {
  key: string
  icon: ReactNode;
  ariaLabel?: string;
  onClick?: () => void;
  disabled?: boolean;
  hidden?: boolean;
}

export interface WordTypeItemProps {
  // 数据
  value: WordTypeInfo;
  // 操作集合
  opArray?: OperationInfo[];
}

export function WordTypeItem(props: WordTypeItemProps) {
  const { value: wordTypeInfo, opArray = [] } = props;
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
          {props.value.name}
        </div>
        <div className="word-type-item-operation">
          {opArray.map(o => o.hidden ? <span /> : (
            <Button
              key={o.key}
              theme="borderless"
              type="secondary"
              size="small"
              disabled={o.disabled}
              icon={o.icon}
              aria-label={o.ariaLabel}
              onClick={o.onClick}
            />
          ))}
        </div>
      </div>
    </>
  );
}
