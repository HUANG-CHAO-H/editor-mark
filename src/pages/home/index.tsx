import { HomeHeader } from './HomeHeader.tsx';
import { HomeLeft } from './HomeLeft.tsx';
import { HomeRight } from './HomeRight.tsx';
import { HomeFooter } from './HomeFooter.tsx';

export function Home() {
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <div style={{ height: 60, overflow: 'hidden' }}><HomeHeader /></div>
      <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: 'calc(100% - 90px)' }}>
        <div style={{ width: 200, height: '100%', overflow: 'hidden' }}>
          <HomeLeft />
        </div>
        <div style={{ width: 'calc(100% - 200px)', height: '100%', overflow: 'hidden' }}><HomeRight /></div>
      </div>
      <div style={{ height: 30, overflow: 'hidden' }}><HomeFooter /></div>
    </div>
  );
}