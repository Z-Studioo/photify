-- Seed categories with images instead of icons
-- Run this after applying migration 008

BEGIN;

-- Clear existing categories
TRUNCATE TABLE categories CASCADE;

-- Insert categories with image URLs (using Unsplash for demo)
INSERT INTO categories (id, name, slug, icon, image_url, bg_color, display_order, is_active, description) VALUES
('11111111-1111-1111-1111-111111111111', 'Custom Frames', 'custom-frames', 'Frame', 
 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&q=80', 
 '#e8e4df', 1, true, 'Premium custom frames for your photos'),

('22222222-2222-2222-2222-222222222222', 'Gallery Walls', 'gallery-walls', 'Layout', 
 'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=800&q=80', 
 '#dfe3e8', 2, true, 'Create stunning gallery wall arrangements'),

('33333333-3333-3333-3333-333333333333', 'Canvas Prints', 'canvas-prints', 'Image', 
 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80', 
 '#e8dfe0', 3, true, 'High-quality canvas prints'),

('44444444-4444-4444-4444-444444444444', 'Art Collection', 'art-collection', 'Palette', 
 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&q=80', 
 '#dfe8e4', 4, true, 'Curated art collection'),

('55555555-5555-5555-5555-555555555555', 'Photo Prints', 'photo-prints', 'Printer', 
 'https://images.unsplash.com/photo-1516733968668-dbdce39c4651?w=800&q=80', 
 '#e4e8df', 5, true, 'Professional photo prints'),

('66666666-6666-6666-6666-666666666666', 'Posters', 'posters', 'Sparkles', 
 'https://images.unsplash.com/photo-1611761481254-8c0317c2fdf6?w=800&q=80', 
 '#e8e0df', 6, true, 'Vibrant poster prints'),

('77777777-7777-7777-7777-777777777777', 'Photo Books', 'photo-books', 'BookOpen', 
 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80', 
 '#dfe4e8', 7, true, 'Custom photo books'),

('88888888-8888-8888-8888-888888888888', 'Gift Sets', 'gift-sets', 'Gift', 
 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80', 
 '#e8dfdf', 8, true, 'Perfect gift sets');

COMMIT;

