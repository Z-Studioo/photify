'use client';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/supabase/client';
import { Search, X, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  is_featured: boolean;
  similarity?: number; // Relevance score from semantic search (0-1)
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      loadRecentSearches();
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load recent searches from localStorage
  const loadRecentSearches = () => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setRecentSearches(JSON.parse(recent).slice(0, 5));
    }
  };

  // Save search to recent
  const saveRecentSearch = (query: string) => {
    const recent = localStorage.getItem('recentSearches');
    let searches = recent ? JSON.parse(recent) : [];

    searches = [query, ...searches.filter((s: string) => s !== query)].slice(
      0,

      5
    );

    localStorage.setItem('recentSearches', JSON.stringify(searches));
  };

  // Load recommended products
  useEffect(() => {
    async function loadRecommended() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('products')
          .select('id, name, slug, images, price, is_featured')
          .eq('active', true)
          .eq('is_featured', true)
          .limit(6);

        if (data) setRecommendedProducts(data);
      } catch (err) {
        console.error('Failed to load recommended products:', err);
      }
    }

    if (isOpen) loadRecommended();
  }, [isOpen]);

  // Semantic search products using AI embeddings
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchProducts = async () => {
      setLoading(true);
      try {
        // Call semantic search API with very low threshold for maximum recall
        const response = await fetch(
          `/api/search/semantic?q=${encodeURIComponent(searchQuery)}&limit=8&threshold=0.1`
        );

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const result = await response.json();

        if (result.success && result.results) {
          // Transform results to match Product interface
          const products = result.results.map((item: any) => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
            images: item.images || [],
            price: item.price,
            is_featured: item.is_featured,
            similarity: item.similarity, // Add relevance score
          }));
          setSearchResults(products);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Semantic search failed:', err);
        // Fallback to basic search if semantic search fails
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from('products')
            .select('id, name, slug, images, price, is_featured')
            .eq('active', true)
            .ilike('name', `%${searchQuery}%`)
            .limit(8);
          if (data) setSearchResults(data);
        } catch (fallbackErr) {
          console.error('Fallback search failed:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchProducts, 400);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      saveRecentSearch(query.trim());
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleProductClick = (slug: string) => {
    navigate(`/product/${slug}`);
    onClose();
  };

  const handleRecentSearch = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className='fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-12 overflow-hidden'>
        {/* Backdrop with blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className='absolute inset-0 bg-black/40 backdrop-blur-md'
          onClick={onClose}
        />

        {/* Modal Content - Centered with margins */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className='relative w-full max-w-4xl max-h-[85vh] bg-white rounded-2xl shadow-2xl'
        >
          <div className='max-h-[85vh] overflow-scroll flex flex-col rounded-2xl shadow-lg'>
            {/* Header */}

            <div className='flex-shrink-0 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50'>
              <div className='px-6 py-5'>
                <div className='flex items-center gap-3'>
                  {/* Search Input */}

                  <div className='flex-1 relative'>
                    <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />

                    <input
                      ref={inputRef}
                      type='text'
                      placeholder='Search for products...'
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e =>
                        e.key === 'Enter' && handleSearch(searchQuery)
                      }
                      className='w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-base

 placeholder:text-gray-400

 focus:outline-none focus:bg-white focus:border-[#f63a9e] focus:ring-2 focus:ring-[#f63a9e]/20

 transition-all duration-200'
                    />
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className='flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors'
                  >
                    <X className='w-5 h-5 text-gray-500' />
                  </button>
                </div>

                {/* Recent Searches */}
                {!searchQuery && recentSearches.length > 0 && (
                  <div className='mt-3 flex items-center gap-2 flex-wrap'>
                    <Clock className='w-4 h-4 text-gray-400' />

                    <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
                      Recent
                    </span>

                    {recentSearches.map((search, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleRecentSearch(search)}
                        className='px-2.5 py-1 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors'
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Content */}

            <div className='flex-1 overflow-y-auto bg-gray-50/50'>
              <div className='px-6 py-6'>
                {/* Search Results */}
                {searchQuery && (
                  <div className='mb-8'>
                    <div className='flex items-center justify-between mb-4'>
                      <h2 className="font-['Bricolage_Grotesque',_sans-serif] text-lg font-semibold text-gray-900">
                        Search Results
                      </h2>
                      {searchResults.length > 0 && (
                        <button
                          onClick={() => handleSearch(searchQuery)}
                          className='text-sm text-[#f63a9e] hover:text-[#e02a8e] font-medium flex items-center gap-1 transition-colors'
                        >
                          View all
                          <ArrowRight className='w-4 h-4' />
                        </button>
                      )}
                    </div>

                    {loading ? (
                      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className='animate-pulse'>
                            <div className='aspect-square bg-gray-200 rounded-xl mb-2' />

                            <div className='h-3 bg-gray-200 rounded w-3/4 mb-2' />

                            <div className='h-3 bg-gray-200 rounded w-1/2' />
                          </div>
                        ))}
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
                        {searchResults.map(product => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className='group cursor-pointer'
                            onClick={() => handleProductClick(product.slug)}
                          >
                            <div className='relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-3 ring-1 ring-gray-200/50'>
                              <ImageWithFallback
                                src={
                                  product.images[0] || '/assets/placeholder.png'
                                }
                                alt={product.name}
                                className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                              />

                              {/* Relevance Score Badge */}

                              {product.similarity &&
                                product.similarity > 0.7 && (
                                  <div className='absolute top-2 left-2 px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full shadow-sm'>
                                    Best Match
                                  </div>
                                )}

                              {product.is_featured && !product.similarity && (
                                <div className='absolute top-2 right-2 px-2 py-0.5 bg-[#f63a9e] text-white text-xs font-semibold rounded-full'>
                                  Popular
                                </div>
                              )}
                            </div>

                            <h3 className='text-sm font-medium text-gray-900 line-clamp-2 mb-1'>
                              {product.name}
                            </h3>

                            <div className='flex items-center justify-between'>
                              <p className='text-sm text-[#f63a9e] font-semibold'>
                                From £{product.price.toFixed(2)}
                              </p>
                              {/* Relevance percentage indicator */}
                              {product.similarity && (
                                <span className='text-xs text-gray-500'>
                                  {Math.round(product.similarity * 100)}% match
                                </span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className='text-center py-16 px-4'>
                        <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                          <Search className='w-8 h-8 text-gray-400' />
                        </div>

                        <p className='text-gray-700 font-medium mb-1'>
                          No products found for &ldquo;{searchQuery}&rdquo;
                        </p>

                        <p className='text-sm text-gray-500'>
                          Try using different keywords or browse popular
                          products below
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommended Products */}
                {!searchQuery && recommendedProducts.length > 0 && (
                  <div>
                    <div className='flex items-center gap-2 mb-4'>
                      <div className='w-8 h-8 bg-gradient-to-br from-[#f63a9e] to-[#e02a8e] rounded-lg flex items-center justify-center'>
                        <TrendingUp className='w-4 h-4 text-white' />
                      </div>
                      <h2 className="font-['Bricolage_Grotesque',_sans-serif] text-lg font-semibold text-gray-900">
                        Popular Products
                      </h2>
                    </div>

                    <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4'>
                      {recommendedProducts.map((product, idx) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className='group cursor-pointer'
                          onClick={() => handleProductClick(product.slug)}
                        >
                          <div className='relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-3 ring-1 ring-gray-200/50 shadow-sm'>
                            <ImageWithFallback
                              src={
                                product.images[0] || '/assets/placeholder.png'
                              }
                              alt={product.name}
                              className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                            />

                            <div className='absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity' />
                          </div>

                          <h3 className='text-sm font-medium text-gray-900 line-clamp-2 mb-1.5'>
                            {product.name}
                          </h3>

                          <div className={`flex items-center justify-between`}>
                            <div className='flex flex-col'>
                              <span className='text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1'>
                                Starting At
                              </span>

                              <div className='flex items-start'>
                                <div className='flex items-start text-[#f63a9e]'>
                                  <span className='font-bold text-lg mt-2 mr-0.5'>
                                    £
                                  </span>

                                  <span className='font-extrabold text-4xl tracking-tighter leading-none font-bricolage'>
                                    {typeof product.price === 'number'
                                      ? Math.floor(product.price)
                                      : product.price}
                                  </span>

                                  <span className='font-bold text-xl mt-2'>
                                    .
                                    {typeof product.price === 'number'
                                      ? product.price.toFixed(2).split('.')[1]
                                      : '00'}
                                  </span>
                                </div>

                                <div className='ml-3 flex flex-col justify-center border-l border-gray-200 pl-3'>
                                  <span className='text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-none'>
                                    Per
                                  </span>

                                  <span className='text-gray-600 text-sm font-bold leading-tight whitespace-nowrap'>
                                    sq in
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
