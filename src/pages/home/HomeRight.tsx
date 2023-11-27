import { MEditor } from '../../components/MEditor';
import {useFileContext} from "../../context/FileContext.tsx";

export function HomeRight() {
  const { fileKey, fileValue } = useFileContext();
  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <MEditor key={fileKey} initValue={fileValue} />
    </div>
  )
}