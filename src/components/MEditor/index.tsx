import {useEffect} from "react";
import {
  Editor,
  Modules,
  MODULE_KEYS,
  UndoModule,
  BlockElementDeserializer,
  TextNodeDeserializer,
} from "@editor-kit/core";
import {
  EditorComponent,
  ContentState,
  Range,
  ZoneState,
  InputModel,
} from '@editor-kit/lite';
import '@editor-kit/core/dist/style/index.css';
import {useEditorContext} from "../../context";
import { WordTypePlugin } from './WordTypeRender.tsx';
import {wordTypeQuery} from "../../models";

// 配置依赖 full 版本
const modules: Modules = {
  [MODULE_KEYS.ContentState]: ContentState,
  [MODULE_KEYS.ZoneState]: ZoneState,
  [MODULE_KEYS.Range]: Range,
  [MODULE_KEYS.UndoModule]: UndoModule,
  [MODULE_KEYS.InputModel]: InputModel
};

export function MEditor() {
  const {editor, setEditor, fontSize} = useEditorContext();
  const wordTypeList = wordTypeQuery.useQuery().data!;
  useEffect(() => {
    if (!editor) {
      return;
    }
    const content = editor.getContent();
    editor.reset();
    editor.setContent(content);
  }, [editor, wordTypeList]);

  return (
    <EditorComponent
      editable
      businessKey="doc_sdk_demo"
      style={{ padding: 5, height: '100%', cursor: 'text', fontSize: `${fontSize.toFixed(1)}rem` }}
      modules={modules}
      register={e => [
        new BlockElementDeserializer(),
        new TextNodeDeserializer(),
        new WordTypePlugin(e, wordTypeList),
      ]}
      onInit={(editor: Editor) => {
        setEditor(editor);
        // editor.on(EditorEventType.SELECTION_CHANGE, ev => {
        //   console.info('EditorEventType.SELECTION_CHANGE', ev);
        // });
        // TODO debug完成后需要删除
        (window as any).editor = editor;
      }}
    />
  );
}