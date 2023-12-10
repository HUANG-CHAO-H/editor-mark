import { Nav } from '@douyinfe/semi-ui';
import { IconFolder, IconUser, IconFolderOpen, IconSave, IconSemiLogo, IconClose } from '@douyinfe/semi-icons';
import {useEditorContext} from "../../context/EditorContext.tsx";

export function HomeHeader() {
  const editorContext = useEditorContext();
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
          { itemKey: 'user', text: '用户管理', icon: <IconUser /> },
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
          }
        }}
      />
    </div>
  );
}