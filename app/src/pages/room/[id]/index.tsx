import { RoomInspirationPage } from '@/components/pages/room';
import { useParams } from 'react-router-dom';
import { Helmet } from '@dr.pogodin/react-helmet';
import { useConsumedInitialData } from '@/ssr/InitialDataContext';

interface RoomData {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  image?: string;
  slug?: string;
}

export default function RoomPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const ssrRoom = useConsumedInitialData<RoomData>('room');

  const title = ssrRoom?.title
    ? `${ssrRoom.title} | Room Inspiration | Photify`
    : 'Room Inspiration | Photify';
  const description =
    ssrRoom?.description ||
    'Discover curated room inspiration at Photify. Explore styled spaces and shop the look.';
  const image = ssrRoom?.image ?? '';

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name='description' content={description} />
        <meta
          name='robots'
          content={ssrRoom ? 'index,follow' : 'index,follow'}
        />
        <meta property='og:type' content='article' />
        <meta property='og:title' content={title} />
        <meta property='og:description' content={description} />
        {image ? <meta property='og:image' content={image} /> : null}
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={title} />
        <meta name='twitter:description' content={description} />
        {image ? <meta name='twitter:image' content={image} /> : null}
      </Helmet>
      <RoomInspirationPage roomId={roomId} />
    </>
  );
}
