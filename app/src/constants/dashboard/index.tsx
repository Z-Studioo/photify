import {
  ImageIcon,
  Crop,
  Zap,
  /* Droplet, */
  CornerUpLeft,
  Circle,
  Grid,
} from 'lucide-react';

interface MenuFeature {
  id: number;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  subtitle: string;
  step: number;
  component: string | null;
  disabled?: boolean;
}

const features: MenuFeature[] = [
  {
    id: 1,
    name: 'SELECT PHOTO',
    icon: ImageIcon,
    subtitle: 'Photo preview & crop',
    step: 1,
    component: 'PhotoSelector',
  },
  {
    id: 2,
    name: 'IMAGE SIZE AND CROP PHOTO',
    icon: Crop,
    subtitle: 'Size & aspect ratio',
    step: 2,
    component: 'RatioSizePanel',
  },
  {
    id: 3,
    name: 'IMAGE OPTIMIZATION',
    icon: Zap,
    subtitle: '80%',
    step: 3,
    component: 'OptimizationControl',
  },
  {
    id: 10,
    name: 'CORNERS',
    icon: CornerUpLeft,
    subtitle: 'Standard',
    step: 10,
    component: null,
    disabled: true,
  },
  {
    id: 11,
    name: 'ROUND FORMATS AND SHAPES',
    icon: Circle,
    subtitle: 'Rectangle',
    step: 11,
    component: null,
    disabled: true,
  },
  {
    id: 12,
    name: 'MULTIPANEL',
    icon: Grid,
    subtitle: 'One Piece',
    step: 12,
    component: null,
    disabled: true,
  },
];

export default features;
