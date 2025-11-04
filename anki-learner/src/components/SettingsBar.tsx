import { useSettings } from '../state/store';

export const SettingsBar = () => {
  const { difficulty, setDifficulty, mode, setMode, writingMode, setWritingMode, jpFont, setJpFont, furigana, setFurigana } = useSettings();
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <select value={difficulty} onChange={(e)=>setDifficulty(e.target.value as any)} className="px-2 py-1 rounded border">
        <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
      </select>
      <select value={mode} onChange={(e)=>setMode(e.target.value as any)} className="px-2 py-1 rounded border">
        <option value="jp-en">JP → EN</option><option value="en-jp">EN → JP</option><option value="both">Both</option>
      </select>
      <select value={writingMode} onChange={(e)=>setWritingMode(e.target.value as any)} className="px-2 py-1 rounded border">
        <option value="horizontal">Horizontal</option>
        <option value="vertical">Vertical (縦書き)</option>
      </select>
      <select value={jpFont} onChange={(e)=>setJpFont(e.target.value as any)} className="px-2 py-1 rounded border">
        <option value="gothic">Gothic (ゴシック)</option>
        <option value="mincho">Mincho (明朝)</option>
        <option value="manga">Book/Manga</option>
        <option value="ui">System UI</option>
      </select>
      <label className="inline-flex items-center gap-1 text-sm">
        <input type="checkbox" checked={furigana} onChange={(e)=>setFurigana(e.target.checked)} />
        Furigana
      </label>
    </div>
  );
};
