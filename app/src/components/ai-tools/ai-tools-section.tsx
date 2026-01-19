import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import { Sparkles, Wand2, Image, Scissors } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAITools } from '@/lib/supabase/hooks';

interface AITool {
  title: string;
  description: string;
  image: string;
  icon: React.ReactNode;
  path?: string;
}

export function AIToolsSection() {
  const navigate = useNavigate();
  
  // Fetch AI tools from API
  const { data: apiTools } = useAITools();
  
  const mockTools: AITool[] = [
    {
      title: 'Restore Image with AI',
      description: 'Bring old photos back to life with AI-powered restoration',
      image: 'https://images.unsplash.com/photo-1512373977447-6a8a90da5f7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbGQlMjBkYW1hZ2VkJTIwcGhvdG98ZW58MXx8fHwxNzYwNzAzNTE1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      icon: <Sparkles className="w-6 h-6" />,
      path: '/ai-restore',
    },
    {
      title: 'AI Photo Editor',
      description: 'Edit your photos like a pro with intelligent AI tools',
      image: 'https://images.unsplash.com/photo-1637519290541-0a12b3185485?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90byUyMGVkaXRpbmclMjBzb2Z0d2FyZXxlbnwxfHx8fDE3NjA2ODUxNzR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      icon: <Wand2 className="w-6 h-6" />,
      path: '/ai-photo-editor',
    },
    {
      title: 'Photo Collage Maker',
      description: 'Create stunning collages with our easy-to-use tool',
      image: 'https://images.unsplash.com/photo-1612681336352-b8b82f3c775a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90byUyMGNvbGxhZ2UlMjBtYWtlcnxlbnwxfHx8fDE3NjA3MDM1MTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      icon: <Image className="w-6 h-6" />,
      path: '/ai-collage',
    },
    {
      title: 'Background Remover',
      description: 'Remove backgrounds instantly with AI precision',
      image: 'https://images.unsplash.com/photo-1572882724878-e17d310e6a74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwdG9vbHN8ZW58MXx8fHwxNzYwNzAzNTEyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      icon: <Scissors className="w-6 h-6" />,
      path: '/ai-background-remover',
    },
  ];

  // Map API tools to component format
  const iconMap: any = {
    'Sparkles': <Sparkles className="w-6 h-6" />,
    'Wand2': <Wand2 className="w-6 h-6" />,
    'Image': <Image className="w-6 h-6" />,
    'Scissors': <Scissors className="w-6 h-6" />,
  };

  const tools: AITool[] = apiTools?.map((tool: any) => ({
    title: tool.title,
    description: tool.description,
    image: tool.image,
    icon: iconMap[tool.icon] || <Wand2 className="w-6 h-6" />,
    path: tool.path,
  })) || mockTools;

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="text-left mb-12">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-['Bricolage_Grotesque',_sans-serif] mb-2" 
            style={{ fontSize: '32px', lineHeight: '1.2', fontWeight: '600' }}
          >
            AI-Powered Creative Tools
          </motion.h2>
          <p className="text-gray-600">Transform your photos with our intelligent editing suite</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group cursor-pointer"
              onClick={() => tool.path && navigate(tool.path)}
            >
              <div className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <ImageWithFallback
                    src={tool.image}
                    alt={tool.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 bg-[#f63a9e] text-white p-3 rounded-full">
                    {tool.icon}
                  </div>
                </div>
                <div className="p-6">
                  <h3 
                    className="font-['Bricolage_Grotesque',_sans-serif] mb-2" 
                    style={{ fontSize: '18px', lineHeight: '1.3', fontWeight: '600' }}
                  >
                    {tool.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">{tool.description}</p>
                  <button className="text-[#f63a9e] hover:text-[#e02a8e] transition-colors flex items-center gap-2 group/btn">
                    Try Now
                    <svg 
                      className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
