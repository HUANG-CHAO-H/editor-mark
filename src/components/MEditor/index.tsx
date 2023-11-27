import {useEffect, useState, useMemo} from "react";
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

export interface MEditorProps {
  initValue: string | ZoneDelta;
}

export function MEditor(props: MEditorProps) {
  const [editor, setEditor] = useState<Editor>();
  const [deltas, setDeltas] = useState<ZoneDelta>();
  const [isEditing, setIsEditing] = useState(false);
  const defaultContent = useMemo<ZoneDelta | undefined>(() => {
    if (!props.initValue) {
      return undefined
    }
    if (typeof props.initValue === 'string') {
      const zoneDelta = new ZoneDelta();
      zoneDelta.insert(props.initValue);
      return zoneDelta;
    }
    return props.initValue;
  }, [props.initValue]);

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
      initData={defaultContent}
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