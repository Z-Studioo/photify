import { useState } from 'react';

interface UseWallCarouselProps {
  defaultWalls: string[];
}

export const useWallCarousel = ({ defaultWalls }: UseWallCarouselProps) => {
  const [currentWallIndex, setCurrentWallIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>(
    'right'
  );
  const [customWalls, setCustomWalls] = useState<string[]>([]);

  const wallImages = [...defaultWalls, ...customWalls];

  const handlePreviousWall = () => {
    setSlideDirection('left');
    setCurrentWallIndex(prev =>
      prev === 0 ? wallImages.length - 1 : prev - 1
    );
  };

  const handleNextWall = () => {
    setSlideDirection('right');
    setCurrentWallIndex(prev =>
      prev === wallImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleSelectIndex = (index: number) => {
    setSlideDirection(index > currentWallIndex ? 'right' : 'left');
    setCurrentWallIndex(index);
  };

  const addCustomWall = (imageUrl: string) => {
    setCustomWalls(prev => [...prev, imageUrl]);
    setCurrentWallIndex(wallImages.length);
    setSlideDirection('right');
  };

  return {
    currentWallIndex,
    slideDirection,
    wallImages,
    handlePreviousWall,
    handleNextWall,
    handleSelectIndex,
    addCustomWall,
  };
};
