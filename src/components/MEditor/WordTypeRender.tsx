import {Plugin, IRenderContext, Editor} from '@editor-kit/core';
import {WORD_TYPE_KEY_PRE, WordTypeInfo, wordTypeQuery} from "../../models";

export class WordTypePlugin extends Plugin {
  // 编辑器实例
  editor: Editor;
  // word type list列表
  list: WordTypeInfo[];

  match(key: string, value: string){
    return key.startsWith(WORD_TYPE_KEY_PRE) && Boolean(value);
  }

  render(context: IRenderContext){
    const { attributes, children } = context;
    const keys = Object.keys(attributes).filter(k => k.startsWith(WORD_TYPE_KEY_PRE) && attributes[k]);
    const arr = this.list.filter(l => keys.includes(l.typeKey));
    if (!arr.length) {
      return children;
    }
    let color = arr[0].color;
    let backgroundColor = arr[0].backgroundColor;
    for (let i = 1; i < arr.length; i++) {
      color = blendColors(color, arr[i].color);
      backgroundColor = blendColors(backgroundColor, arr[i].backgroundColor);
    }
    context.style = { ...context.style, color, backgroundColor }
    return children;
  }

  constructor(editor: Editor, wordTypeList: WordTypeInfo[]) {
    super();
    this.editor = editor;
    const array: WordTypeInfo[] = [];
    for (const item of wordTypeList) {
      const children = item.children || [];
      array.push({...item, children: undefined });
      for (const child of children) {
        array.push({...child, children: undefined });
      }
    }
    this.list = array.filter(v => !v.hidden);
  }

  reset() {
    this.list = wordTypeQuery.run('flatArray').filter(v => !v.hidden);
  }
}

/**
 * 两种颜色混合后的值
 * @param {string} color1 颜色1
 * @param {string} color2 颜色2
 * @param {number} weight 权重
 * @return {string} blendedColor 最终结果
 */
function blendColors(color1: string, color2: string, weight = 0.5) {
  const color1RGB = parseColor(color1);
  const color2RGB = parseColor(color2);

  // 计算混合后的RGB值
  const blendedR = Math.floor((1 - weight) * color1RGB.r + weight * color2RGB.r);
  const blendedG = Math.floor((1 - weight) * color1RGB.g + weight * color2RGB.g);
  const blendedB = Math.floor((1 - weight) * color1RGB.b + weight * color2RGB.b);

  return `#${componentToHex(blendedR)}${componentToHex(blendedG)}${componentToHex(blendedB)}`;
}

// 解析颜色字符串为RGB值
function parseColor(color: string) {
  const hex = color.replace(/^#/, '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return { r, g, b };
}

// 将RGB值转换为十六进制颜色字符串
function componentToHex(c: number) {
  const hex = c.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

