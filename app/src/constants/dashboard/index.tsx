import {
  ImageIcon,
  Crop,
  Zap,
  // Monitor,
  // Frame,
  Droplet,
  // Layers,
  // Box,
  // Square,
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
  disabled?: boolean; // Add disabled property
}

const features: MenuFeature[] = [
  {
    id: 1,
    name: 'SELECT PHOTO',
    icon: ImageIcon,
    subtitle: 'Upload your image',
    step: 1,
    component: 'PhotoSelector',
  },
  {
    id: 2,
    name: 'IMAGE SIZE AND CROP PHOTO',
    icon: Crop,
    subtitle: '24 by 16 (External: 24 by 16)',
    step: 2,
    component: 'RatioSizePanel',
  },
  {
    id: 6,
    name: 'SIDE APPEARANCE',
    icon: Droplet,
    subtitle: 'Wrapped edges',
    step: 6,
    component: 'EdgeSelector',
  },
  {
    id: 3,
    name: 'IMAGE OPTIMIZATION',
    icon: Zap,
    subtitle: '80%',
    step: 3,
    component: 'OptimizationControl',
  },
  // {
  //   id: 4,
  //   name: 'WIDE WALL ULTRA HD',
  //   icon: Monitor,
  //   subtitle: 'Activated',
  //   step: 4,
  //   component: null,
  //   disabled: true, // Disable this feature
  // },
  // {
  //   id: 5,
  //   name: 'FRAME PROFILE AND COLOR',
  //   icon: Frame,
  //   subtitle: 'Frame',
  //   step: 5,
  //   component: null,
  //   disabled: true, // Disable this feature
  // },
  // {
  //   id: 7,
  //   name: 'PAPER',
  //   icon: Layers,
  //   subtitle: 'Fuji Crystal Archive Glossy',
  //   step: 7,
  //   component: null,
  //   disabled: true, // Disable this feature
  // },
  // {
  //   id: 8,
  //   name: 'HANGING HARDWARE',
  //   icon: Box,
  //   subtitle: 'Aluminum Rails',
  //   step: 8,
  //   component: null,
  //   disabled: true, // Disable this feature
  // },
  // {
  //   id: 9,
  //   name: 'MOTIF BORDER',
  //   icon: Square,
  //   subtitle: 'Without White Border',
  //   step: 9,
  //   component: null,
  //   disabled: true, // Disable this feature
  // },
  {
    id: 10,
    name: 'CORNERS',
    icon: CornerUpLeft,
    subtitle: 'Standard',
    step: 10,
    component: null,
    disabled: true, // Disable this feature
  },
  {
    id: 11,
    name: 'ROUND FORMATS AND SHAPES',
    icon: Circle,
    subtitle: 'Rectangle',
    step: 11,
    component: null,
    disabled: true, // Disable this feature
  },
  {
    id: 12,
    name: 'MULTIPANEL',
    icon: Grid,
    subtitle: 'One Piece',
    step: 12,
    component: null,
    disabled: true, // Disable this feature
  },
];

export default features;