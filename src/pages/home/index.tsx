import { HomeHeader } from './HomeHeader.tsx';
import { HomeLeft } from './HomeLeft.tsx';
import { HomeRight } from './HomeRight.tsx';
import { HomeFooter } from './HomeFooter.tsx';
import { useSize } from '../../utils';

export function Home() {
  const [ref, size] = useSize<HTMLDivElement>({ heightType: 'offset', defaultHeight: 40 })
  return (
    <div className="home-container">
      <div className="home-header"><HomeHeader /></div>
      <div className="home-main" style={{ height: `calc(100vh - 60px - ${size.height}px)` }}>
        <div>
          <HomeLeft />
        </div>
        <div><HomeRight /></div>
      </div>
      <div className="home-footer" ref={ref}><HomeFooter /></div>
    </div>
  );
}