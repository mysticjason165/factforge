#!/usr/bin/env python3
"""Generate reviewable, long-form draft content for FactForge's existing articles.

Run from the repository root, AFTER adding this file and its companion
post-content.json. Reads your existing articles.json. Does NOT change 125
existing HTML post files. New post content appears through reader-upgrade.js.

Choose ONE provider:
  Local (no API fees):  python expand_all.py --provider ollama --model llama3.1
  OpenAI API (paid):    set OPENAI_API_KEY, then python expand_all.py --provider openai
  Test 1 article:      python expand_all.py --provider ollama --limit 1
  See what remains:    python expand_all.py --dry-run

Requires Python 3.10+; no third-party Python dependencies. Ollama itself
must be installed/running with your desired model already downloaded.
AI-generated drafts may contain errors: review all facts, safety advice,
examples, and links before publishing. Do not put API keys in GitHub files.
"""
import argparse
import json
import os
from pathlib import Path
import re
import sys
import time
import urllib.error
import urllib.request

HERE = Path(__file__).resolve().parent
ARTICLES = HERE / 'articles.json'
CONTENT = HERE / 'post-content.json'


def word_count(text):
    return len(re.findall(r"\b[\w’'-]+\b", str(text), flags=re.UNICODE))


def content_word_count(record):
    if not isinstance(record, dict):
        return 0
    parts = [record.get('deck', '')]
    parts.extend(record.get('takeaways', []))
    for section in record.get('sections', []):
        if isinstance(section, dict):
            parts.append(section.get('heading', ''))
            parts.extend(section.get('paragraphs', []))
            parts.extend(section.get('bullets', []))
    return word_count(' '.join(str(v) for v in parts))


def request_json(url, payload, headers=None, timeout=600):
    body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
    headers = {'Content-Type': 'application/json', **(headers or {})}
    request = urllib.request.Request(url, data=body, headers=headers, method='POST')
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.load(response)


def extract_json(text):
    text = text.strip().removeprefix('```json').removeprefix('```').removesuffix('```').strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find('{')
        end = text.rfind('}')
        if start == -1 or end == -1:
            raise ValueError('No JSON object was returned by the model.')
        return json.loads(text[start:end+1])


def ask(provider, model, prompt, temperature=0.5):
    if provider == 'ollama':
        data = request_json('http://localhost:11434/api/generate', {
            'model': model,
            'prompt': prompt,
            'stream': False,
            'format': 'json',
            'options': {'temperature':temperature,'num_predict':11000,'num_ctx':14000},
        })
        return extract_json(data.get('response', ''))
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise RuntimeError('Set OPENAI_API_KEY in your local terminal. Never upload keys to GitHub.')
    data = request_json('https://api.openai.com/v1/responses', {
        'model':model,
        'input':[
            {'role':'system','content':'You are a careful, original, research-conscious educational editor. Output only valid JSON, without markdown.'},
            {'role':'user','content':prompt}
        ],
        'max_output_tokens':12000,
    }, {'Authorization':'Bearer '+api_key}, timeout=600)
    # The Responses API returns output text content in output[] -> content[].
    blocks = []
    for output in data.get('output',[]):
        for part in output.get('content',[]):
            if part.get('type') == 'output_text':
                blocks.append(part.get('text',''))
    if not blocks:
        raise ValueError('No output_text returned. Response status: '+str(data.get('status')))
    return extract_json('\n'.join(blocks))


def make_prompt(article, target_words):
    original = '\n\n'.join(article.get('paragraphs', []))
    category = article.get('categoryLabel', article.get('category','General'))
    safety = {
        'health': 'Health: distinguish general education from clinical advice. No individual diagnoses, treatment plans, invented statistics or claims of guaranteed results. Encourage appropriate professional input where relevant.',
        'wellbeing': 'Wellbeing: avoid oversimplified neuroscience and unsupported mental-health claims. Be sensitive to diverse situations and recommend professional support for ongoing serious difficulties.',
        'knowledge': 'Knowledge and Safety: provide careful practical risk reduction; no risky or dangerous procedural instructions. Flag uncertainty. Avoid fabricated statistics or legal claims.',
        'college': 'College & Work: respect academic integrity and honest marketing; never promise guaranteed income. Distinguish general information from financial or legal advice.',
        'mindset': 'Mindset: maintain nuance, avoid absolutist moral advice; acknowledge practical obligations and individual differences.'
    }.get(article.get('category'), '')
    return f'''Write an ORIGINAL, substantive, educational FactForge long-form article that develops the EXISTING article faithfully without deleting or repeating its three original paragraphs.
TITLE: {article['title']}
CATEGORY: {category}
CURRENT THREE PARAGRAPHS (already displayed first on the site):
{original}

Write ADDITIONAL material ONLY, in a JSON object with exactly this shape:
{{"deck":"1 compelling sentence introduction","takeaways":["3 or 4 useful takeaways"],"sections":[{{"heading":"Specific helpful section title","paragraphs":["Fully developed original paragraph 1","Fully developed original paragraph 2"],"bullets":["Optional concise useful step"]}}],"youtubeUrl":""}}

WORD TARGET: {target_words} to {target_words+450} ADDITIONAL words (on top of the existing article's three paragraphs); at least 11 DIFFERENT sections with substantial paragraphs. Prefer 13–17 sections with one or two thoughtful paragraphs each. Vary the structure naturally. Use relevant, specific examples, real-world constraints, useful decision principles, mistakes to avoid, a practical exercise, and FAQ content; do not write generic copy that could fit every topic. Don't just repeat or paraphrase the original three paragraphs. Do not pad with restatements.
Do not invent interviews, quotes, experiences, studies, numerical claims, links or sources. If making a scientific or regulatory claim you cannot verify, qualify it or avoid it. Write for general readers in a warm, precise, down-to-earth voice. Avoid false certainty or exaggerated promises.
{ safety }
Do not supply a made-up YouTube link: leave youtubeUrl as an empty string. Only valid JSON, no markdown fences.'''


def make_continuation_prompt(article, record, needed):
    titles = [s.get('heading','') for s in record['sections']]
    return f'''Add NEW, non-repetitive material to the long-form article titled "{article['title']}" in the {article['categoryLabel']} category.
Existing section headings: {json.dumps(titles,ensure_ascii=False)}
The current draft is too short. Write at least {needed+250} MORE words (prefer 4–6 fully developed new sections) with practical examples and nuance not already covered by those headings. Keep all claims careful and do not invent sources or data. Output ONLY this JSON object:
{{"sections":[{{"heading":"New unique section title","paragraphs":["At least two substantial original paragraphs"],"bullets":[]}}]}}
Avoid repeating existing ideas; do not add a final conclusion unless it is genuinely new.'''


def normalize(record):
    if not isinstance(record,dict):
        raise ValueError('AI returned something other than a JSON object')
    sections=[]
    for sec in record.get('sections',[]):
        if not isinstance(sec,dict) or not isinstance(sec.get('heading'),str):
            continue
        paragraphs=[str(p).strip() for p in sec.get('paragraphs',[]) if isinstance(p,str) and len(p.strip())>25]
        if not paragraphs:
            continue
        section={'heading':sec['heading'].strip(),'paragraphs':paragraphs}
        bullets=[str(b).strip() for b in sec.get('bullets',[]) if isinstance(b,str) and b.strip()]
        if bullets:
            section['bullets']=bullets
        sections.append(section)
    if not sections:
        raise ValueError('Model returned no usable sections')
    return {
        'deck':str(record.get('deck','')).strip(),
        'takeaways':[str(x) for x in record.get('takeaways',[]) if isinstance(x,str)][:5],
        'sections':sections,
        'youtubeUrl':'' # Only add a video after checking that it is real and relevant.
    }


def save_atomic(data):
    path=CONTENT.with_suffix('.tmp')
    path.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    path.replace(CONTENT)


def main():
    parser=argparse.ArgumentParser(description='Expand the 125 FactForge posts into reviewable long-form draft articles.')
    parser.add_argument('--provider',choices=['ollama','openai'],default='ollama')
    parser.add_argument('--model',help='e.g. llama3.1 (Ollama) or gpt-4.1-mini (OpenAI)')
    parser.add_argument('--slug',help='Only process this article slug')
    parser.add_argument('--limit',type=int,default=0,help='Generate at most N articles this run (0 = all)')
    parser.add_argument('--overwrite',action='store_true',help='Regenerate even already expanded articles')
    parser.add_argument('--dry-run',action='store_true',help='Show articles still needing long-form copy, without contacting AI')
    args=parser.parse_args()
    if not ARTICLES.exists():
        print('Missing articles.json. Copy this script into the ROOT of your existing FactForge repository, alongside articles.json.',file=sys.stderr)
        return 2
    articles=json.loads(ARTICLES.read_text(encoding='utf-8'))
    content=json.loads(CONTENT.read_text(encoding='utf-8')) if CONTENT.exists() else {}
    model=args.model or ('gpt-4.1-mini' if args.provider=='openai' else 'llama3.1')
    pending=[]
    for article in articles:
        slug=article['slug']
        if args.slug and args.slug!=slug:continue
        word_total=(article.get('words') or word_count(' '.join(article.get('paragraphs',[]))))+content_word_count(content.get(slug,{}))
        if args.overwrite or word_total < 2000:
            pending.append(article)
    print(f'{len(articles)} posts found; {len(pending)} need writing for a real 10+ min read (200 words/min).')
    if args.slug and not pending:
        print('Already long enough, or slug not found. Add --overwrite to regenerate.')
        return 0
    if args.dry_run:
        for a in pending:print(' - '+a['slug'])
        return 0
    if args.limit > 0:pending=pending[:args.limit]
    if not pending:return 0
    print(f'Provider: {args.provider}; model: {model}. Generated articles are DRAFTS requiring factual review.')
    if args.provider=='openai':print('OpenAI API usage is billed separately and may be costly for 125 long articles.')
    failures=[]
    for index,article in enumerate(pending,1):
        slug=article['slug']
        print(f'[{index}/{len(pending)}] Writing {article["title"]} ...',flush=True)
        try:
            draft=normalize(ask(args.provider,model,make_prompt(article,2250)))
            original=article.get('words') or word_count(' '.join(article.get('paragraphs',[])))
            for attempt in range(3):
                current=original+content_word_count(draft)
                if current>=2000:break
                supplement=ask(args.provider,model,make_continuation_prompt(article,draft,2000-current))
                extra=normalize({'sections':supplement.get('sections',[])})['sections']
                existing={s['heading'].lower() for s in draft['sections']}
                draft['sections'].extend(s for s in extra if s['heading'].lower() not in existing)
            total=original+content_word_count(draft)
            if total < 2000:
                print(f'    Warning: still only {total} words (~{max(1,(total+199)//200)} minutes); requires manual expansion.')
            if total>4000:
                print(f'    Warning: {total} words is over 20 minutes; consider trimming.')
            if isinstance(content.get(slug),dict):
                for key in ['images','youtubeUrl']:
                    if content[slug].get(key):draft[key]=content[slug][key]
            content[slug]=draft
            save_atomic(content)
            print(f'    Saved {total} words, approximately {max(1,(total+199)//200)} min read')
        except (Exception,KeyboardInterrupt) as exc:
            if isinstance(exc,KeyboardInterrupt):
                print('\nInterrupted. Earlier posts are already safely saved.')
                return 130
            failures.append(slug)
            print(f'    ERROR: {type(exc).__name__}: {exc}',file=sys.stderr)
            if isinstance(exc,urllib.error.HTTPError) and exc.code in [401,403]:
                print('Authentication or permission error; stopping.',file=sys.stderr)
                break
            time.sleep(2)
    print(f'Finished. Review post-content.json and add it to GitHub. Failures: {len(failures)}')
    for slug in failures:print('  FAILED:',slug)
    return 1 if failures else 0


if __name__=='__main__':raise SystemExit(main())
