export enum ScreenState {
  START = 'START',
  VERSE = 'VERSE',
  DETAIL = 'DETAIL',
}

export interface MannaData {
  verseRef: string;
  verseText: string;
  fullVerse: string;
  interpretation: string;
  mission: string;
}

export interface ScreenProps {
  onNext: () => void;
  onBack?: () => void;
  data: MannaData;
  isMuted?: boolean;
  toggleMute?: () => void;
}
