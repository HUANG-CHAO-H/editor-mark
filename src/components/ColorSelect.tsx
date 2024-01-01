import {SketchPicker} from "react-color";
import {Popover, withField} from "@douyinfe/semi-ui";

export function ColorSelect(props: { value?: string, onChange?: (value: string) => void }) {
  return (
    <Popover
      trigger="click"
      position="right"
      content={
        <SketchPicker
          color={props.value}
          disableAlpha={false}
          onChange={v => props.onChange?.(v.hex)}
        />
      }>
      <div style={{
        backgroundColor: props.value,
        width: 60,
        height: '100%',
        minHeight: 30,
        borderRadius: 5,
        borderStyle: "outset"
      }} />
    </Popover>
  );
}
export const FormColorSelect = withField(ColorSelect);