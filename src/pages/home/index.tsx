import { HomeHeader } from './HomeHeader.tsx';
import { HomeLeft } from './HomeLeft.tsx';
import { HomeRight } from './HomeRight.tsx';
import { HomeFooter } from './HomeFooter.tsx';

export function Home() {
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <div style={{ height: 60, overflow: 'hidden' }}><HomeHeader /></div>
      <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: 'calc(100% - 100px)' }}>
        <div style={{ width: 300, height: '100%', overflow: 'hidden' }}>
          <HomeLeft />
        </div>
        <div style={{ width: 'calc(100% - 300px)', height: '100%', overflow: 'hidden' }}><HomeRight /></div>
      </div>
      <div style={{ height: 40, overflow: 'hidden' }}><HomeFooter /></div>
    </div>
  );
}