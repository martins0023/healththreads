// pages/map.jsx
import dynamic from 'next/dynamic';

const LocalResourcesMap = dynamic(
  () => import('../components/LocalResourcesMap'),
  { ssr: false }
);

export default function MapPage() {
  return (
    <div className="">
      <LocalResourcesMap />
    </div>
  );
}