import {useState} from "react";
import isEqual from 'lodash/isEqual';
import {WordTypeItem} from "./WordTypeItem.tsx";
import {formatWordTypeInfo, WordTypeInfo} from "../../models";

const testValue: WordTypeInfo[] = [
  { typeKey: '01', name: '测试-01', color: 'yellow', backGroundColor: '', description: '这是一段测试' },
  { typeKey: '02', name: '测试-02', color: 'green', backGroundColor: '', description: '这是一段测试' },
  { typeKey: '03', name: '测试-03', color: 'yellow', backGroundColor: '', description: '这是一段测试' },
  { typeKey: '04', name: '测试-04', color: 'green', backGroundColor: '', description: '这是一段测试' },
]

export function WordTypeList() {
  const [list, setList] = useState<WordTypeInfo[]>(testValue);
  return (
    <div>
      {list.map((v: WordTypeInfo, index: number) => (
        <WordTypeItem
          key={v.typeKey}
          typeKey={v.typeKey}
          name={v.name}
          color={v.color}
          backGroundColor={v.backGroundColor}
          description={v.description}
          selected={v.typeKey === '04'}
          onTypeInfoChange={info => {
            const formatV = formatWordTypeInfo(info);
            setList(oldV => {
              if (isEqual(oldV[index], formatV)) {
                return oldV;
              }
              const newV = [...oldV];
              newV[index] = formatV;
              return newV;
            });
          }}
        />
      ))}
    </div>
  )
}
