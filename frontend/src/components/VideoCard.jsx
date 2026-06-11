import GridCard from './GridCard';
import ListCard from './ListCard';

export default function VideoCard({ video, list, ranks, onPlay, onChannelClick, onEditChannel }) {
  if (list) return <ListCard video={video} ranks={ranks} onPlay={onPlay} onChannelClick={onChannelClick} onEditChannel={onEditChannel} />;
  return <GridCard video={video} ranks={ranks} onPlay={onPlay} onChannelClick={onChannelClick} onEditChannel={onEditChannel} />;
}
