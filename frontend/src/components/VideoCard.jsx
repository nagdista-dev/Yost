import GridCard from './GridCard';
import ListCard from './ListCard';

export default function VideoCard({ video, list, ranks, onPlay, onChannelClick, onEditChannel, onSave, isSaved }) {
  if (list) return <ListCard video={video} ranks={ranks} onPlay={onPlay} onChannelClick={onChannelClick} onEditChannel={onEditChannel} onSave={onSave} isSaved={isSaved} />;
  return <GridCard video={video} ranks={ranks} onPlay={onPlay} onChannelClick={onChannelClick} onEditChannel={onEditChannel} onSave={onSave} isSaved={isSaved} />;
}
