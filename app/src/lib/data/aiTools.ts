import { type AITool } from './types';

export const aiTools: AITool[] = [
  {
    id: 'restore',
    title: 'Restore Image with AI',
    description: 'Bring old photos back to life with AI-powered restoration',
    image: 'https://images.unsplash.com/photo-1512373977447-6a8a90da5f7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbGQlMjBkYW1hZ2VkJTIwcGhvdG98ZW58MXx8fHwxNzYwNzAzNTE1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    path: '/ai-restore',
  },
  {
    id: 'editor',
    title: 'AI Photo Editor',
    description: 'Edit your photos like a pro with intelligent AI tools',
    image: 'https://images.unsplash.com/photo-1637519290541-0a12b3185485?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90byUyMGVkaXRpbmclMjBzb2Z0d2FyZXxlbnwxfHx8fDE3NjA2ODUxNzR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    path: '/ai-photo-editor',
  },
  {
    id: 'collage',
    title: 'Photo Collage Maker',
    description: 'Create stunning collages with our easy-to-use tool',
    image: 'https://images.unsplash.com/photo-1612681336352-b8b82f3c775a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG90byUyMGNvbGxhZ2UlMjBtYWtlcnxlbnwxfHx8fDE3NjA3MDM1MTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    path: '/ai-collage',
  },
  {
    id: 'background',
    title: 'Background Remover',
    description: 'Remove backgrounds instantly with AI precision',
    image: 'https://images.unsplash.com/photo-1572882724878-e17d310e6a74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwdG9vbHN8ZW58MXx8fHwxNzYwNzAzNTEyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    path: '/ai-background-remover',
  },
];

