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
import {DeltaSet} from "@editor-kit/delta";
import '@editor-kit/core/dist/style/index.css';
import {useEditorContext} from "../../context";
import { WordTypePlugin } from './WordTypeRender.tsx';
import {wordTypeQuery} from "../../models";
import {useEffect, useState} from "react";

// 配置依赖 full 版本
const modules: Modules = {
  [MODULE_KEYS.ContentState]: ContentState,
  [MODULE_KEYS.ZoneState]: ZoneState,
  [MODULE_KEYS.Range]: Range,
  [MODULE_KEYS.UndoModule]: UndoModule,
  [MODULE_KEYS.InputModel]: InputModel
};

const deltaSet = new DeltaSet({
  "0": {
    "ops": [
      {
        "insert": "如果您没有被这个列表压垮，那么这一定意味着你可能已经"
      },
      {
        "attributes": {
          "WTK04": "true"
        },
        "insert": "解决了所有的服务器状态"
      },
      {
        "insert": "问题，值得获奖。 然而，如果你和大多数人一样，要么还没有解决所有这些挑战，要么还没有解决大部分挑战，那么我们只是触及了表面!\n"
      }
    ],
    "zoneId": "0",
    "zoneType": "Z"
  }
});

export function MEditor() {
  const {setEditor} = useEditorContext();
  const wordTypeList = wordTypeQuery.useQuery().data!;
  const [refresh, setRefresh] = useState(Number.MIN_SAFE_INTEGER);
  useEffect(() => setRefresh(v => v + 1), [wordTypeList]);
  return (
    <EditorComponent
      key={refresh}
      editable
      businessKey="doc_sdk_demo"
      style={{ padding: 5, height: '100%', cursor: 'text' }}
      modules={modules}
      register={e => [
        new BlockElementDeserializer(),
        new TextNodeDeserializer(),
        new WordTypePlugin(e, wordTypeList),
      ]}
      initData={deltaSet}
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