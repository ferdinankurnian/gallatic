import { createContext, useContext, useState, ReactNode } from 'react';

interface SelectionContextType {
  isSelectionMode: boolean;
  selectedImages: Set<string>;
  setSelectionMode: (mode: boolean) => void;
  setSelectedImages: (images: Set<string>) => void;
}

const SelectionContext = createContext<SelectionContextType | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  const setSelectionMode = (mode: boolean) => {
    setIsSelectionMode(mode);
    if (!mode) setSelectedImages(new Set());
  };

  return (
    <SelectionContext.Provider value={{ isSelectionMode, selectedImages, setSelectionMode, setSelectedImages }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) throw new Error('useSelection must be used within SelectionProvider');
  return context;
}
