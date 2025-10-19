import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

type ViewMode = 'room' | '3d' | 'crop'

interface ViewContextType {
  selectedView: ViewMode
  setSelectedView: (view: ViewMode) => void
  isTransitioning: boolean
  setIsTransitioning: (transitioning: boolean) => void
}

const ViewContext = createContext<ViewContextType | undefined>(undefined)

export const ViewProvider = ({ children }: { children: ReactNode }) => {
  const [selectedView, setSelectedView] = useState<ViewMode>('room')
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleViewChange = (view: ViewMode) => {
    if (view !== selectedView) {
      setSelectedView(view)
    }
  }

  return (
    <ViewContext.Provider 
      value={{ 
        selectedView, 
        setSelectedView: handleViewChange, 
        isTransitioning, 
        setIsTransitioning 
      }}
    >
      {children}
    </ViewContext.Provider>
  )
}

export const useView = () => {
  const context = useContext(ViewContext)
  if (!context) {
    throw new Error('useView must be used within ViewProvider')
  }
  return context
}

export default ViewContext