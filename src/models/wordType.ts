export interface WordTypeInfo {
  // 类型的key(UUID)
  typeKey: string;
  // 类型名称
  name: string;
  // 类型的字体颜色
  color: string;
  // 类型标记的背景颜色
  backGroundColor: string;
  // 类型描述
  description: string;
}

export function formatWordTypeInfo(info: Partial<WordTypeInfo> | Record<string, any>): WordTypeInfo {
  return {
    typeKey: info.typeKey || '',
    name: info.name || '',
    color: info.color || '',
    backGroundColor: info.backGroundColor || '',
    description: info.description || '',
  }
}