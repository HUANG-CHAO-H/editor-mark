import {useMemo} from "react";
import { Nav, Modal } from '@douyinfe/semi-ui';
import {
  IconFolder,
  IconArticle,
  IconSimilarity,
  IconFolderOpen,
  IconSave,
  IconSemiLogo,
  IconClose,
  IconDuration,
  IconBox,
  IconPlus,
  IconMinus,
  IconEyeClosed,
  IconEyeOpened,
} from '@douyinfe/semi-icons';
import { IconToken } from '@douyinfe/semi-icons-lab';
import type {NavItems} from "@douyinfe/semi-ui/lib/es/navigation";
import {useEditorContext, useWordTypeContext} from "../../context";
import {wordTypeQuery} from "../../models";

export function HomeHeader() {
  const editorContext = useEditorContext();
  const wordTypeContext = useWordTypeContext();

  const items = useMemo<NavItems>(() => [
    {
      itemKey: 'file',
      text: '文件',
      icon: <IconFolder />,
      items: [
        {
          itemKey: 'file-open',
          text: '打开文件',
          icon: <IconFolderOpen />,
        },
        {
          itemKey: 'file-save',
          text: '保存文件',
          icon: <IconSave />,
        },
        {
          itemKey: 'file-close',
          text: '关闭文件',
          icon: <IconClose />,
        },
      ]
    },
    {
      itemKey: 'word',
      text: '元话语分类',
      icon: <IconArticle />,
      items: [
        {
          itemKey: 'word-update',
          text: '管理分类',
          icon: <IconSimilarity />,
        },
        {
          itemKey: 'word-open',
          text: '打开分类配置',
          icon: <IconFolderOpen />,
        },
        {
          itemKey: 'word-save',
          text: '保存分类配置',
          icon: <IconSave />,
        },
        {
          itemKey: 'word-close',
          text: '关闭分类',
          icon: <IconClose />,
        },
        {
          itemKey: 'word-batch',
          text: '批量操作',
          icon: <IconToken />,
          items: [
            { itemKey: 'word-batch-show', text: '一键显示', icon: <IconEyeOpened /> },
            { itemKey: 'word-batch-hide', text: '一键隐藏', icon: <IconEyeClosed /> },
          ],
        },
      ]
    },
    {
      itemKey: 'editor',
      text: '编辑器',
      icon: <IconBox />,
      items: [
        {
          itemKey: 'fontSize-value',
          text: `当前字体: ${editorContext.fontSize.toFixed(1)} rem`,
          disabled: true,
        },
        {
          itemKey: 'fontSize-add',
          text: '字体 +',
          icon: <IconPlus />,
        },
        {
          itemKey: 'fontSize-delete',
          text: '字体 -',
          icon: <IconMinus />,
        },
      ]
    },
    {
      itemKey: 'data-analyse',
      text: '数据统计',
      icon: <IconDuration />,
    },
  ], [editorContext.fontSize]);
  return (
    <div style={{ width: '100%' }}>
      <Nav
        mode={'horizontal'}
        header={{
          logo: <IconSemiLogo style={{ height: '36px', fontSize: 36 }} />,
          text: '元话语标记'
        }}
        items={items}
        selectedKeys={[]}
        onSelect={info => {
          switch (info.itemKey) {
            case 'file-open':
              editorContext.openFile();
              break;
            case 'file-save':
              editorContext.saveFile();
              break;
            case 'file-close':
              Modal.confirm({
                title: '确认关闭当前文档?',
                centered: true,
                onOk: () => void editorContext.closeFile(),
              });
              break;
            case 'word-update':
              wordTypeContext.openWordSetting();
              break;
            case 'word-open':
              wordTypeContext.openJSON();
              break;
            case 'word-save':
              wordTypeContext.saveJSON();
              break;
            case 'word-close':
              Modal.confirm({
                title: '确认关闭Word配置?',
                centered: true,
                onOk: () => void wordTypeQuery.setQueryData([], []),
              });
              break;
            case 'word-batch-show':
              wordTypeQuery.run('showAll');
              break;
            case 'word-batch-hide':
              wordTypeQuery.run('hideAll');
              break;
            case 'data-analyse':
              wordTypeContext.dataAnalyse();
              break;
            case 'fontSize-add':
              editorContext.setFontSize(v => Math.floor((v + 0.11) * 10) / 10);
              break;
            case 'fontSize-delete':
              editorContext.setFontSize(v => Math.floor((v - 0.09) * 10) / 10);
              break;
          }
        }}
      />
    </div>
  );
}