import React, {ReactNode, useContext, useMemo, useRef, useState} from "react";
import type { Editor } from "@editor-kit/core";
import {createContext} from "../utils";

export interface IEditorContext {
  editor: Editor | undefined;
  // 设置, 更新editor
  setEditor: React.Dispatch<React.SetStateAction<Editor | undefined>>;
  // 文件信息
  fileInfo: File | undefined;
  // 打开文件
  openFile: () => void;
  // 保存文件
  saveFile: () => void;
  // 关闭文件
  closeFile: () => void;
}

export const EditorContext = createContext<IEditorContext>(undefined, 'EditorContext');
export const useEditorContext = () => useContext(EditorContext);

export function EditorContextProvider(props: { children?: ReactNode }) {
  const [editor, setEditor] = useState<Editor>();
  const [fileInfo, setFileInfo] = useState<File>();
  const [fileKey, setFileKey] = useState(Number.MIN_SAFE_INTEGER);
  const inputRef = useRef<HTMLInputElement>(null);
  const contextValue = useMemo(() => ({
    editor,
    setEditor,
    fileInfo,
    openFile: () => void inputRef.current?.click(),
    saveFile: () => undefined,
    closeFile: () => undefined,
  }), [editor, fileInfo]);
  return (
    <EditorContext.Provider value={contextValue}>
      {props.children}
      <input
        key={fileKey}
        type="file"
        ref={inputRef}
        style={{display: 'none'}}
        onChange={e => {
          const fileList = e.target.files;
          if (!fileList?.length) {
            return;
          }
          const info = fileList[0];
          const reader = new FileReader();
          reader.onload = () => {
            setFileInfo(info);
            setFileKey(v => v + 1);
            console.log(info, reader.result);
            editor?.setText(reader.result as string || '');
          };
          reader.readAsText(info);
        }}
      />
    </EditorContext.Provider>
  );
}