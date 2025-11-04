import { create } from 'zustand';

export type Mode = 'jp-en'|'en-jp'|'both';
export type Difficulty = 'easy'|'medium'|'hard';
export type WritingMode = 'horizontal'|'vertical';
export type JpFont = 'ui'|'gothic'|'mincho'|'manga';

type Settings = {
  mode: Mode;
  difficulty: Difficulty;
  writingMode: WritingMode;
  jpFont: JpFont;
  furigana: boolean;
  setMode: (m:Mode)=>void;
  setDifficulty: (d:Difficulty)=>void;
  setWritingMode: (w:WritingMode)=>void;
  setJpFont: (f:JpFont)=>void;
  setFurigana: (b:boolean)=>void;
};

const persisted = (key:string, initial:Partial<Settings>) => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initial; }
  catch { return initial; }
};

export const useSettings = create<Settings>((set,get)=>({
  ...(persisted('jpdrills.settings',{
    mode:'jp-en', difficulty:'easy', writingMode:'horizontal', jpFont:'gothic', furigana:true
  }) as Settings),
  setMode:(m)=>{ set({mode:m}); localStorage.setItem('jpdrills.settings', JSON.stringify({...get(),mode:m})); },
  setDifficulty:(d)=>{ set({difficulty:d}); localStorage.setItem('jpdrills.settings', JSON.stringify({...get(),difficulty:d})); },
  setWritingMode:(w)=>{ set({writingMode:w}); localStorage.setItem('jpdrills.settings', JSON.stringify({...get(),writingMode:w})); },
  setJpFont:(f)=>{ set({jpFont:f}); localStorage.setItem('jpdrills.settings', JSON.stringify({...get(),jpFont:f})); },
  setFurigana:(b)=>{ set({furigana:b}); localStorage.setItem('jpdrills.settings', JSON.stringify({...get(),furigana:b})); },
}));
