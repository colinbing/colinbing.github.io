import { v4 as uuid } from 'uuid';

type Token = { id:string; jp:string; en:string; lemma:string; pos:string; helper?:boolean; features:string[] };
type Card = {
  jp:string;
  en:string;
  tokens: Token[];
  readings: Record<string,string>;
  paired: { polite:string; casual:string };
  explain: string[];
  exampleByLemma: Record<string,{jp?:string; en?:string}>;
};

const studied: Array<{lemma:string; pos:string; surface:string; reading?:string; gloss:string}> = [
  {lemma:'行く', pos:'verb', surface:'行きます', reading:'いきます', gloss:'go'},
  {lemma:'勉強する', pos:'verb', surface:'勉強します', reading:'べんきょうします', gloss:'study'},
  {lemma:'学校', pos:'noun', surface:'学校', reading:'がっこう', gloss:'school'},
  {lemma:'家', pos:'noun', surface:'家', reading:'いえ', gloss:'house'},
  {lemma:'水', pos:'noun', surface:'水', reading:'みず', gloss:'water'},
  {lemma:'大きい', pos:'i-adj', surface:'大きい', reading:'おおきい', gloss:'big'},
];

function pick<T>(arr:T[]):T { return arr[Math.floor(Math.random()*arr.length)] }

function politeToCasual(jp:string) {
  return jp
    .replace(/ます(。)?$/,'る$1')   // naive: 行きます→行く (ok for ichidan only, but stub)
    .replace(/です(。)?$/,'$1');    // い-adj/noun polite→drop です in casual (for demo)
}

export function generateSentence(): Card {
  // Simple template: [PLACE で 勉強します] or [家は大きいです]
  const t = Math.random() < 0.5 ? 'verb' : 'adj';

  if (t === 'verb') {
    const place = pick(studied.filter(x=>x.pos==='noun'));
    const verb  = studied.find(x=>x.lemma==='勉強する')!;
    const jp = `${place.surface}で${verb.surface}。`; // 学校で勉強します。
    const en = `Study at ${place.gloss}.`;
    const tokens:Token[] = [
      {id:uuid(), jp:place.surface, en:place.gloss, lemma:place.lemma, pos:place.pos, features:[]},
      {id:uuid(), jp:'で', en:'at (location of action)', lemma:'で', pos:'particle', features:['particle.de']},
      {id:uuid(), jp:verb.surface, en:'study (polite)', lemma:verb.lemma, pos:'verb', features:['polite','tense.present']}
    ];
    const readings:Record<string,string> = {};
    tokens.forEach(tk=>{ readings[tk.id] = studied.find(s=>s.surface===tk.jp)?.reading || ''; });
    const polite = jp;
    const casual = politeToCasual(jp).replace('勉強します','勉強する');
    return {
      jp, en, tokens, readings,
      paired:{polite, casual},
      explain:['location で','present polite'],
      exampleByLemma:{}
    };
  } else {
    const noun = studied.find(x=>x.lemma==='家')!;
    const adj  = studied.find(x=>x.lemma==='大きい')!;
    const jp = `${noun.surface}は${adj.surface}です。`;
    const en = `The house is big.`;
    const tokens:Token[] = [
      {id:uuid(), jp:noun.surface, en:noun.gloss, lemma:noun.lemma, pos:noun.pos, features:[]},
      {id:uuid(), jp:'は', en:'topic', lemma:'は', pos:'particle', features:['particle.wa']},
      {id:uuid(), jp:adj.surface+'です', en:'is big', lemma:adj.lemma, pos:'i-adj', features:['predicative','polite']}
    ];
    const readings:Record<string,string> = {};
    tokens.forEach(tk=>{ readings[tk.id] = studied.find(s=>tk.jp.startsWith(s.surface))?.reading || ''; });
    const polite = jp;
    const casual = politeToCasual(jp);
    return {
      jp, en, tokens, readings,
      paired:{polite, casual},
      explain:['い-adj predicate','copula polite'],
      exampleByLemma:{}
    };
  }
}
