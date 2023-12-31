import { Nav, Modal } from '@douyinfe/semi-ui';
import { IconFolder, IconArticle, IconSimilarity, IconFolderOpen, IconSave, IconSemiLogo, IconClose } from '@douyinfe/semi-icons';
import {useEditorContext, useWordTypeContext} from "../../context";
import {wordTypeQuery} from "../../models";

export function HomeHeader() {
  const editorContext = useEditorContext();
  const wordTypeContext = useWordTypeContext();
  return (
    <div style={{ width: '100%' }}>
      <Nav
        mode={'horizontal'}
        header={{
          logo: <IconSemiLogo style={{ height: '36px', fontSize: 36 }} />,
          text: 'Semi 运营后台'
        }}
        items={[
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
            text: 'Word',
            icon: <IconArticle />,
            items: [
              {
                itemKey: 'word-update',
                text: '管理Word',
                icon: <IconSimilarity />,
              },
              {
                itemKey: 'word-open',
                text: '打开Word配置',
                icon: <IconFolderOpen />,
              },
              {
                itemKey: 'word-save',
                text: '保存Word配置',
                icon: <IconSave />,
              },
              {
                itemKey: 'word-close',
                text: '关闭Word配置',
                icon: <IconClose />,
              },
            ]
          },
        ]}
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
              editorContext.closeFile();
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
          }
        }}
      />
    </div>
  );
}