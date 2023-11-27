import {createContext, ReactNode, useContext, useMemo, useRef, useState} from "react";

export interface IFileContext {
  // 文件信息
  fileInfo: File | undefined;
  // 文件数据
  fileValue: string;
  // 文件的key(用来标识文件是否发生了改变)
  fileKey: number | string;
  // 打开文件
  openFile: () => void;
}

export const FileContext = createContext<IFileContext>(new Proxy({} as IFileContext, {
  get(_, p: string) {
    throw new Error(`can not read ${p} from global FileContext`)
  },
  set(_, p: string): boolean {
    throw new Error(`can not set ${p} to global FileContext`)
  }
}));

export const useFileContext = () => useContext(FileContext);

export function FileContextProvider (props: { children?: ReactNode }) {
  const [fileInfo, setFileInfo] = useState<File>();
  const [fileValue, setFileValue] = useState<string>('');
  const [fileKey, setFileKey] = useState(Number.MIN_SAFE_INTEGER);
  const inputRef = useRef<HTMLInputElement>(null);
  const contextValue = useMemo<IFileContext>(() => ({
    fileKey,
    fileInfo,
    fileValue,
    openFile() {
      inputRef.current?.click()
    },
  }), [fileKey, fileInfo, fileValue]);
  return (
    <FileContext.Provider value={contextValue}>
      {props.children}
      <input
        key={fileKey}
        type="file"
        ref={inputRef}
        style={{ display: 'none' }}
        onChange={e => {
          const fileList = e.target.files;
          if (!fileList?.length) {
            return;
          }
          const info = fileList[0];
          const reader = new FileReader();
          reader.onload = function fileReadCompleted() {
            setFileInfo(info);
            setFileValue(reader.result as string || '');
            setFileKey(v => v + 1);
            console.log(info, reader.result);
          };
          reader.readAsText(info);
        }}
      />
    </FileContext.Provider>
  )
}