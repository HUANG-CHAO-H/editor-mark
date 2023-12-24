import {
  Editor,
  Modules,
  MODULE_KEYS,
  ContentState,
  ZoneState,
  Range,
  EditorComponent,
  UndoModule,
  InputModel,
  IPlugin,
  BlockElementDeserializer,
  TextNodeDeserializer,
  EditorEventType,
} from "@editor-kit/core";
import '@editor-kit/core/dist/style/index.css';
// import {EditorEventType} from "@editor-kit/core/dist/event";
import {useEditorContext} from "../../context";
import { BackgroundPlugin } from './WordTypeRender.tsx';

// 配置依赖 full 版本
const modules: Modules = {
  [MODULE_KEYS.ContentState]: ContentState,
  [MODULE_KEYS.ZoneState]: ZoneState,
  [MODULE_KEYS.Range]: Range,
  [MODULE_KEYS.UndoModule]: UndoModule,
  [MODULE_KEYS.InputModel]: InputModel
};

const registerPlugin = (editor: Editor): IPlugin[] => {
  return [
    new BlockElementDeserializer(),
    new TextNodeDeserializer(),
    new BackgroundPlugin(),
  ];
};


export function MEditor() {
  const {setEditor} = useEditorContext();

  return (
    <EditorComponent
      editable
      businessKey="doc_sdk_demo"
      style={{ padding: 5, height: '100%', cursor: 'text' }}
      modules={modules}
      register={registerPlugin}
      onInit={(editor: Editor) => {
        setEditor(editor);
        editor.on(EditorEventType.SELECTION_CHANGE, ev => {
          console.info('EditorEventType.SELECTION_CHANGE', ev);
        });
        // TODO debug完成后需要删除
        (window as any).editor = editor;
      }}
    />
  );
}