import React, {ReactNode, useContext, useMemo, useRef, useState} from "react";
import {Toast} from "@douyinfe/semi-ui";
import type { Editor } from "@editor-kit/core";
import {DeltaSet} from "@editor-kit/delta";
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
  const aRef = useRef<HTMLAnchorElement>(null);
  const contextValue = useMemo(() => ({
    editor,
    setEditor,
    fileInfo,
    openFile: () => void inputRef.current?.click(),
    saveFile: () => {
      const a = aRef.current;
      if (!a || !editor) {
        Toast.error('EditorContextProvider Error: 未知错误');
        return;
      }
      const data = editor.getContent().deltas;
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json;charset=utf-8'});
      a.href = URL.createObjectURL(blob);
      a.download = fileInfo?.name || 'word-text.json';
      a.click();
    },
    closeFile: () => void editor?.reset(),
  }), [editor, fileInfo]);
  return (
    <EditorContext.Provider value={contextValue}>
      {props.children}
      <a ref={aRef}/>
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
            const str = reader.result;
            if (!editor) {
              Toast.error('reader.onload Error: 未知错误');
              return;
            }
            if (typeof str !== 'string') {
              Toast.error('文件格式错误');
              return;
            }
            try {
              const obj = JSON.parse(str);
              if (obj?.['0']?.zoneType === "Z") {
                editor.setContent(new DeltaSet(obj));
              } else {
                editor.setText(str || '');
              }
            } catch (e) {
              editor.setText(str || '');
            }
          };
          reader.readAsText(info);
        }}
      />
    </EditorContext.Provider>
  );
}