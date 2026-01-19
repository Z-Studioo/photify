import { RoomInspirationPage } from '@/components/pages/room';
import { useParams } from 'react-router-dom';

export default function RoomPage() {
  const { id: roomId } = useParams<{ id: string }>();
  return <RoomInspirationPage roomId={roomId} />;
}

