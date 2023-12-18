import {WordTypeItem} from "./WordTypeItem.tsx";
import {useWordTypeHelper, WordTypeHelper, WordTypeInfo} from "../../models";

const helper = new WordTypeHelper([
  { typeKey: '01', name: '测试-01', color: 'yellow', backGroundColor: '', description: '这是一段测试' },
  { typeKey: '02', name: '测试-02', color: 'green', backGroundColor: '', description: '这是一段测试' },
  { typeKey: '03', name: '测试-03', color: 'yellow', backGroundColor: '', description: '这是一段测试' },
  { typeKey: '04', name: '测试-04', color: 'green', backGroundColor: '', description: '这是一段测试' },
]);

export function WordTypeList() {
  const [typeHelper] = useWordTypeHelper(helper);
  return (
    <div>
      {typeHelper.list.map((v: WordTypeInfo, index: number) => (
        <WordTypeItem
          key={v.typeKey}
          typeKey={v.typeKey}
          name={v.name}
          color={v.color}
          backGroundColor={v.backGroundColor}
          description={v.description}
          selected={v.typeKey === '04'}
          onTypeInfoChange={info => {
            typeHelper.update(index, info);
          }}
        />
      ))}
    </div>
  )
}
