import {useEffect, useMemo, useState} from "react";
import {EditorEventType} from "@editor-kit/core";
import type {EditorSelectionChangeEvent} from "@editor-kit/core/dist/event/interface";
import {useEditorContext} from "../../context";
import {wordTypeQuery} from "../../models";

import './style.less';

export function HomeFooter() {
  const {editor} = useEditorContext();
  const list = wordTypeQuery.useQuery().data!;
  const [keySet, setKeySet] = useState<Set<string>>();
  useEffect(() => {
    if (!editor) {
      return;
    }
    let timeout: NodeJS.Timeout | number | undefined;
    const handler = (event: EditorSelectionChangeEvent) => {
      if (timeout !== undefined) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        const attributes = editor.getContentState().getAttributes(event.current.start, event.current.end);
        const keySet = new Set<string>();
        for (let i = 0; i < attributes.length; i++) {
          if (attributes[i][1]) {
            keySet.add(attributes[i][0]);
          }
        }
        setKeySet(keySet);
      }, 300);
    }
    editor.on(EditorEventType.SELECTION_CHANGE, handler);
    return () => void editor.off(EditorEventType.SELECTION_CHANGE, handler);
  }, [editor]);

  const content = useMemo(() => {
    if (!keySet?.size || !list.length) {
      return null;
    }
    return list.filter(l => keySet.has(l.typeKey)).map(l => (
      <div key={l.typeKey} style={{ color: l.color, backgroundColor: l.backgroundColor }}>{l.name}</div>
    ));
  }, [list, keySet]);
  return (
    <div className="home-footer">
      {content}
    </div>
  )
}