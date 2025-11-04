import { clsx } from 'clsx';

export const TokenPopup = ({
  token, x, y, example, onMark, onClose
}:{
  token:{ id:string; jp:string; en:string; lemma:string; pos:string; features:string[]; helper?:boolean };
  x:number; y:number;
  example?: { jp?:string; en?:string };
  onMark:(known:boolean)=>void;
  onClose:()=>void;
})=>{
  return (
    <div className="fixed z-50" style={{left: Math.max(12, x-160), top: Math.max(12, y+12)}}>
      <div className="w-80 rounded-xl border bg-white dark:bg-neutral-900 shadow-lg p-3">
        <div className="text-lg">{token.jp} <span className="ml-1 text-sm text-neutral-500">({token.lemma})</span></div>
        <div className="text-sm text-neutral-600 dark:text-neutral-300">{token.en}</div>
        {token.helper && <div className="text-xs mt-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 inline-block">helper</div>}
        {example?.jp && (
          <div className="mt-2 text-sm">
            <div className="text-neutral-500 mb-0.5">Deck example</div>
            <div>{example.jp}</div>
            {example.en && <div className="text-neutral-500">{example.en}</div>}
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <button className={clsx("px-3 py-1.5 rounded bg-emerald-600 text-white")} onClick={()=>onMark(true)}>Knew</button>
          <button className={clsx("px-3 py-1.5 rounded bg-red-600 text-white")} onClick={()=>onMark(false)}>Didn’t know</button>
          <button className="ml-auto px-3 py-1.5 rounded border" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
