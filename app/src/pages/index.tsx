import { useState, useEffect } from 'react';
import { HomePage } from '@/components/pages/home';
import { createClient } from '@/lib/supabase/client';
import { Helmet } from '@dr.pogodin/react-helmet';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useConsumedInitialData } from '@/ssr/InitialDataContext';
import { useCanonicalUrl } from '@/lib/seo';

interface HomeInitialData {
  featuredProducts: any[];
  rooms: any[];
  artProducts: any[];
}

function HomeMeta() {
  const canonical = useCanonicalUrl();
  return (
    <Helmet>
      <title>Home | Photify</title>
      <meta name='title' content='Home | Photify' />
      <meta
        name='description'
        content='Discover stunning photo products and art collections at Photify. Transform your memories into beautiful wall art and decor.'
      />
      <meta name='robots' content='index,follow' />
      <link rel='canonical' href={canonical} />
      <meta property='og:type' content='website' />
      <meta property='og:url' content={canonical} />
      <meta property='og:title' content='Home | Photify' />
      <meta
        property='og:description'
        content='Discover stunning photo products and art collections at Photify. Transform your memories into beautiful wall art and decor.'
      />
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content='Home | Photify' />
      <meta
        name='twitter:description'
        content='Discover stunning photo products and art collections at Photify.'
      />
    </Helmet>
  );
}

export default function Home() {
  const ssr = useConsumedInitialData<HomeInitialData>('home');

  const [featuredProducts, setFeaturedProducts] = useState<any[]>(
    ssr?.featuredProducts ?? []
  );
  const [rooms, setRooms] = useState<any[]>(ssr?.rooms ?? []);
  const [artProducts, setArtProducts] = useState<any[]>(
    ssr?.artProducts ?? []
  );
  const [loading, setLoading] = useState(!ssr);

  useEffect(() => {
    if (ssr) return;

    const fetchData = async () => {
      const supabase = createClient();

      const { data: productsData } = await supabase
        .from('products')
        .select(
          'id, name, slug, images, price, fixed_price, config, is_featured, active, product_type'
        )
        .eq('is_featured', true)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(8);

      const { data: roomsData } = await supabase
        .from('rooms')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true })
        .limit(4);

      const { data: artData } = await supabase
        .from('art_products')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(8);

      setFeaturedProducts(productsData || []);
      setRooms(roomsData || []);
      setArtProducts(artData || []);
      setLoading(false);
    };

    fetchData();
  }, [ssr]);

  if (loading) {
    return (
      <>
        <HomeMeta />
        <LoadingSpinner />
      </>
    );
  }

  return (
    <>
      <HomeMeta />
      <HomePage
        initialFeaturedProducts={featuredProducts}
        initialRooms={rooms}
        initialArtProducts={artProducts}
      />
    </>
  );
}
