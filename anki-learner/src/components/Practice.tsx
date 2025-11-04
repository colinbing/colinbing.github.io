import { useEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from '../state/store';
import { clsx } from 'clsx';
import { generateSentence } from '../generator/generate';
import { TokenPopup } from './TokenPopup';

type Token = { id:string; jp:string; en:string; lemma:string; pos:string; helper?:boolean; features:string[] };

export const Practice = () => {
  const { writingMode, jpFont, furigana } = useSettings();
  const [card, setCard] = useState<ReturnType<typeof generateSentence> | null>(null);
  const [marks, setMarks] = useState<Record<string, boolean>>({}); // tokenId -> known?
  const [showAnswer, setShowAnswer] = useState(false);
  const [popup, setPopup] = useState<{token:Token; x:number; y:number} | null>(null);

  useEffect(()=>{ setCard(generateSentence()); setMarks({}); setShowAnswer(false); },[]);

  const handleShow = () => setShowAnswer(true);
  const handleNext = () => {
    // default: any unmarked token = known
    // TODO: persist to Supabase (responses + response_lemmas)
    setCard(generateSentence());
    setMarks({}); setShowAnswer(false); setPopup(null);
  };

  const fontClass = useMemo(()=>{
    return jpFont === 'gothic' ? 'font-gothic' :
           jpFont === 'mincho' ? 'font-mincho' :
           jpFont === 'manga' ? 'font-manga' : 'font-ui';
  },[jpFont]);

  const jpBoxClass = clsx(
    'jp-text rounded-xl p-4 border bg-white/70 dark:bg-neutral-900/60',
    fontClass,
    writingMode === 'vertical' ? 'jp-vertical h-[380px] w-full flex justify-center items-center text-2xl leading-relaxed' : 'text-2xl leading-10'
  );

  if (!card) return null;

  return (
    <div className="mt-6 space-y-4">
      <div className={jpBoxClass}
        onClick={()=> setPopup(null)}
      >
        {/* JP surface; tokens clickable */}
        {card.tokens.map(tok => (
          <span key={tok.id}
            className={clsx(
              'px-0.5 cursor-pointer',
              marks[tok.id] === false && 'bg-red-200/60 dark:bg-red-800/40 rounded',
              marks[tok.id] === true && 'bg-green-200/60 dark:bg-green-800/40 rounded'
            )}
            onClick={(e)=> {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              setPopup({token:tok, x:rect.left + rect.width/2, y:rect.top});
            }}
            title={tok.en}
          >
            {furigana ? (
              <ruby>
                {tok.jp}<rt>{card.readings[tok.id]}</rt>
              </ruby>
            ) : tok.jp}
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        {!showAnswer ? (
          <button className="px-4 py-2 rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" onClick={handleShow}>Show</button>
        ) : (
          <>
            <RevealBlock card={card} />
            <div className="flex-1" />
          </>
        )}
      </div>

      <div className="flex gap-2">
        {/* Card-grade buttons */}
        <button className="px-3 py-2 rounded bg-red-500 text-white" onClick={handleNext}>Did Not Know</button>
        <button className="px-3 py-2 rounded bg-amber-500 text-white" onClick={handleNext}>Knew Most</button>
        <button className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={handleNext}>Easy</button>
        <div className="flex-1" />
        <button className="px-4 py-2 rounded border" onClick={handleNext}>Next</button>
      </div>

      {popup && (
        <TokenPopup
          token={popup.token}
          x={popup.x}
          y={popup.y}
          example={card.exampleByLemma[popup.token.lemma]}
          onMark={(known:boolean)=>{
            setMarks(m=>({...m, [popup.token.id]: known}));
            setPopup(null);
          }}
          onClose={()=>setPopup(null)}
        />
      )}
    </div>
  );
};

const RevealBlock = ({card}:{card:ReturnType<typeof generateSentence>}) => {
  return (
    <div className="w-full rounded-xl border p-3 space-y-2">
      <Row label="Polite">
        {card.paired.polite}
      </Row>
      <Row label="Casual">
        {card.paired.casual} <span className="text-xs text-neutral-500">〔polite→plain, topic drop if applicable〕</span>
      </Row>
      <Row label="English">
        {card.en}
      </Row>
      <div className="flex flex-wrap gap-2 pt-2">
        {card.explain.map(tag=>(
          <span key={tag} className="text-xs px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-800">{tag}</span>
        ))}
      </div>
    </div>
  );
};

const Row = ({label, children}:{label:string; children:React.ReactNode}) => (
  <div><span className="inline-block w-20 text-sm text-neutral-500">{label}</span><span>{children}</span></div>
);
