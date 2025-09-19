import { EnhancedMap } from './enhanced-map';

interface MapProps {
  selectedZone?: any;
  onClearZone?: () => void;
}

export function Map({ selectedZone, onClearZone }: MapProps) {
  return <EnhancedMap selectedZone={selectedZone} onClearZone={onClearZone} />;
}