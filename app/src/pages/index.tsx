'use client';
import { useState, useEffect } from 'react';
import { HomePage } from '@/components/pages/home';
import { createClient } from '@/lib/supabase/client';
import { Helmet } from '@dr.pogodin/react-helmet';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [artProducts, setArtProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      // Fetch featured products client-side
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(8);
      
      // Fetch rooms client-side
      const { data: roomsData } = await supabase
        .from('rooms')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true })
        .limit(4);
      
      // Fetch art products client-side
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
  }, []);

  if (loading) {
    return (
      <>
        <Helmet>
            <title>Home | Photify</title>
            <meta name='title' content='Home | Photify' />
            <meta
              name="description"
              content="Discover stunning photo products and art collections at Photify. Transform your memories into beautiful wall art and decor."
            />
            <meta name="robots" content="index,follow" />
        </Helmet>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f63a9e]" />
        </div>
      </>
    );
  }

  return (
    <>
    <Helmet>
          <title>Home | Photify</title>
          <meta
            name="description"
            content="Discover stunning photo products and art collections at Photify. Transform your memories into beautiful wall art and decor."
          />
        </Helmet>
    <HomePage 
      initialFeaturedProducts={featuredProducts} 
      initialRooms={rooms} 
      initialArtProducts={artProducts}
      />
      </>
  );
}
