import { RoomInspirationPage } from '@/components/pages/room';
import { useParams } from 'react-router';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Room Inspiration | Photify',
    description: 'Preview how your chosen art will look in a styled room.',
    path: '/room',
    noindex: true,
  });

export default function RoomPage() {
  const { id: roomId } = useParams<{ id: string }>();
  return <RoomInspirationPage roomId={roomId} />;
}
