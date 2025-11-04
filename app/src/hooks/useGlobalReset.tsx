import { useEdge } from '@/context/EdgeContext';
import { useUpload } from '@/context/UploadContext';
import { useView } from '@/context/ViewContext';

export const useGlobalReset = () => {
  const { reset: resetUpload } = useUpload();
  const { reset: resetEdge } = useEdge();
  const { reset: resetView } = useView();
  const resetAll = () => {
    resetUpload();
    resetEdge();
    resetView();
  };

  return { resetAll };
};
