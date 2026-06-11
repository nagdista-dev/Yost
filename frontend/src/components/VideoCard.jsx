import GridCard from './GridCard';
import ListCard from './ListCard';

export default function VideoCard({ video, list, ranks, onPlay, onChannelClick }) {
  if (list) return <ListCard video={video} ranks={ranks} onPlay={onPlay} onChannelClick={onChannelClick} />;
  return <GridCard video={video} ranks={ranks} onPlay={onPlay} onChannelClick={onChannelClick} />;
}
