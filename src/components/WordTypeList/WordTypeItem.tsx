import {useState} from "react";
import { Button, Typography } from '@douyinfe/semi-ui';
import { IconDisc, IconSetting } from '@douyinfe/semi-icons';
import { WordTypeInfo } from '../../models';
import './style.less';
import {ItemSettingModal} from "./ItemSettingModal.tsx";

export interface WordTypeItemProps extends WordTypeInfo {
  // 选中状态
  selected?: boolean;
  // 当word type发生变更时的回调函数
  onTypeInfoChange: (info: WordTypeInfo) => void;
}

export function WordTypeItem(props: WordTypeItemProps) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <div
        className="word-type-item"
        style={{color: props.color || undefined, backgroundColor: props.backGroundColor}}
      >
        <div className="word-type-item-label">
          <IconDisc style={{opacity: props.selected ? undefined : 0}}/>&nbsp;
          <span>{props.name}</span>
        </div>
        <Button
          theme="borderless"
          type="primary"
          size="small"
          icon={<IconSetting />}
          aria-label="设置"
          onClick={() => setVisible(true)}
        />
      </div>
      <ItemSettingModal
        {...props}
        visible={visible}
        setVisible={setVisible}
        isCreate={false}
        onChange={props.onTypeInfoChange}
      />
    </>
  );
}
