import {useEffect, useState} from "react";
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
  EditorEventType,
} from "@editor-kit/core";
import {ZoneDelta} from "@editor-kit/delta";
import {Deltas} from "@editor-kit/delta/dist/interface";
import '@editor-kit/core/dist/style/index.css';
import {useEditorContext} from "../../context/EditorContext.tsx";

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
    // new KeyboardShortcuts({ editor }),
  ];
};


export function MEditor() {
  const {editor, setEditor} = useEditorContext();
  const [deltas, setDeltas] = useState<ZoneDelta>();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const onFocus = () => {
      setIsEditing(true);
    }
    const onBlur = () => {
      setIsEditing(false);
      setDeltas(editor.getContent(true).deltas[0])
    }
    editor.on(EditorEventType.FOCUS, onFocus);
    editor.on(EditorEventType.BLUR, onBlur);
    return () => {
      editor.off(EditorEventType.FOCUS, onFocus);
      editor.off(EditorEventType.BLUR, onBlur);
    }
  }, [editor]);

  return (
    <EditorComponent
      editable
      businessKey="doc_sdk_demo"
      style={{ padding: 5, height: '100%', cursor: 'text' }}
      modules={modules}
      register={registerPlugin}
      onInit={(editor: Editor) => {
        setEditor(editor);
        (window as any).editor = editor;
      }}
    />
  );
}