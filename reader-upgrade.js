'use strict';
/**
 * FactForge reader upgrade, no build tools or dependencies.
 * Works with the EXISTING 125 post HTML files, articles.json and index.html.
 * New long-form text comes from post-content.json. No invented reading-time claims.
 */
(() => {
  const thisScript = document.currentScript;
  const base = new URL('./', thisScript.src);
  const root = filename => new URL(filename, base).href;
  const catPhotos = {
    college: [
      ['photo-1516321318423-f06f85e504b3','A laptop and work materials on a desk'],
      ['photo-1497366811353-6870744d04b2','Light-filled collaborative workspace'],
      ['photo-1522071820081-009f0129c71c','People collaborating around a table'],
      ['photo-1456324504439-367cee3b3c32','Open books on a desk'],
      ['photo-1497366754035-f200968a6e72','Modern shared workspace'],
      ['photo-1515378791036-0648a3ef77b2','Desk set up for focused work'],
      ['photo-1523240795612-9a054b0db644','Students working together']
    ],
    wellbeing: [
      ['photo-1441974231531-c6227db76b6e','Quiet green woodland'],
      ['photo-1470252649378-9c29740c9fa8','Warm sunlight over the landscape'],
      ['photo-1506126613408-eca07ce68773','A calm setting for reflection'],
      ['photo-1472396961693-142e6e269027','Forest landscape with natural light'],
      ['photo-1518837695005-2083093ee35b','Ocean waves in natural light'],
      ['photo-1490750967868-88aa4486c946','Soft flowers in natural light']
    ],
    health: [
      ['photo-1498837167922-ddd27525d352','Fresh foods arranged on a table'],
      ['photo-1512621776951-a57141f2eefd','A colorful meal made with vegetables'],
      ['photo-1571019613454-1cb2f99b2d8b','People exercising at a fitness facility'],
      ['photo-1552674605-db6ffd4facb5','A runner on a path'],
      ['photo-1547592180-85f173990554','Fresh foods prepared for a meal'],
      ['photo-1505751172876-fa1923c5c528','Health and wellness setting']
    ],
    knowledge: [
      ['photo-1481627834876-b7833e8f5570','Bookshelves in a library'],
      ['photo-1456324504439-367cee3b3c32','Books and notes for learning'],
      ['photo-1516321318423-f06f85e504b3','Technology at a study desk'],
      ['photo-1461749280684-dccba630e2f6','Computer screen with programming work'],
      ['photo-1499750310107-5fef28a66643','Notebook and pen ready for research'],
      ['photo-1506784983877-45594efa4cbe','Written planning materials']
    ],
    mindset: [
      ['photo-1441974231531-c6227db76b6e','Sunlight filtering through trees'],
      ['photo-1470252649378-9c29740c9fa8','Open landscape at sunset'],
      ['photo-1490750967868-88aa4486c946','Flowers in gentle light'],
      ['photo-1472396961693-142e6e269027','Woodland landscape'],
      ['photo-1500530855697-b586d89ba3ee','Wide open landscape'],
      ['photo-1518837695005-2083093ee35b','Sea and sky on a quiet day']
    ]
  };
  const countWords = value => String(value || '').trim().split(/\s+/u).filter(Boolean).length;
  const slugOf = url => decodeURIComponent(new URL(url, location.href).pathname.split('/').pop() || '').replace(/\.html$/i, '');
  const escId = value => String(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').slice(0,70);
  const create = (tag, className, textValue) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textValue !== undefined && textValue !== null) el.textContent = String(textValue);
    return el;
  };
  const fetchJson = async name => {
    try {
      const r = await fetch(root(name), {cache: 'no-store'});
      if (!r.ok) throw new Error(name + ' returned ' + r.status);
      return await r.json();
    } catch (err) {
      console.warn('FactForge: could not load ' + name, err);
      return name === 'post-content.json' ? {} : [];
    }
  };
  const upgradedWords = record => {
    if (!record || !Array.isArray(record.sections)) return 0;
    return countWords(record.deck) + (record.takeaways || []).reduce((n, s)=>n+countWords(s),0) +
      record.sections.reduce((n,s)=>n+countWords(s.heading)+
        (s.paragraphs||[]).reduce((p,t)=>p+countWords(t),0)+
        (s.bullets||[]).reduce((p,t)=>p+countWords(t),0)+countWords(s.quote),0);
  };
  const photoUrl = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;
  function selectImages(category, slug, override) {
    if (Array.isArray(override) && override.length >= 3) {
      const valid = override.slice(0, 5).filter(item => item && /^https:\/\//i.test(item.src || '') && (item.alt || '').length > 2);
      if (valid.length >= 3) return valid;
    }
    const pool = catPhotos[category] || catPhotos.knowledge;
    let hash = 0;
    for (const char of slug) hash = ((hash * 31) + char.charCodeAt(0)) >>> 0;
    const start = hash % pool.length;
    return Array.from({length:4},(_,i)=>{
      const [id, alt] = pool[(start+i)%pool.length];
      return {src:photoUrl(id),alt,caption:alt,credit:'Unsplash'};
    });
  }
  function figure(item, hero = false) {
    const f = create('figure', hero ? 'ff-hero' : 'ff-figure');
    const img = create('img');
    img.src = item.src;
    img.alt = item.alt || 'Article photograph';
    img.loading = hero ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    if (hero) img.fetchPriority = 'high';
    // If a remote photo fails, fall back to an existing FactForge image.
    img.addEventListener('error',()=>{
      if (img.dataset.fallback) return;
      img.dataset.fallback = '1';
      img.src = root('assets/forest.jpg');
    });
    f.append(img);
    const caption = create('figcaption', '', (item.caption || item.alt || '') + (item.credit ? ` · ${item.credit}` : ''));
    f.append(caption);
    return f;
  }
  function updateHome(articles, content) {
    const bySlug = new Map(articles.map(a => [a.slug,a]));
    document.querySelectorAll('.card').forEach(card => {
      const href = card.querySelector('h3 a')?.href;
      if (!href) return;
      const slug = slugOf(href);
      const article = bySlug.get(slug);
      if (!article) return;
      const minutes = Math.max(1, Math.ceil(((article.words || countWords((article.paragraphs || []).join(' '))) + upgradedWords(content[slug])) / 200));
      const kicker = card.querySelector('.card-kicker');
      if (kicker) kicker.textContent = kicker.textContent.replace(/\d+\s*MIN READ/i, `${minutes} MIN READ`);
    });
  }
  function addProgress(){
    const progress = create('div','ff-progress');
    progress.setAttribute('aria-hidden','true');
    document.body.append(progress);
    let ticking = false;
    const update = () => {
      ticking=false;
      const height = document.documentElement.scrollHeight - innerHeight;
      progress.style.width = `${height > 0 ? Math.min(100,Math.max(0,scrollY/height*100)):100}%`;
    };
    addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}},{passive:true});
    addEventListener('resize',update,{passive:true});
    update();
  }
  function youtubeId(input){
    try {
      const url = new URL(input);
      if(url.protocol !== 'https:') return null;
      const hostname = url.hostname.toLowerCase();
      let id = null;
      if(hostname === 'youtu.be' || hostname === 'www.youtu.be') id=url.pathname.slice(1).split('/')[0];
      if(['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(hostname)){
        if(url.pathname === '/watch') id=url.searchParams.get('v');
        else id=url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
      }
      return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? id : null;
    } catch (_) {return null;}
  }
  function addVideo(post, heading, record){
    const wrap = create('section','ff-video');
    wrap.append(create('h2','', 'Keep exploring'));
    const found = youtubeId(record.youtubeUrl || record.videoUrl || '');
    if(found){
      wrap.append(create('p','', `Watch a related video selected for “${heading}”.`));
      const btn = create('button','', '▶ Play related video');
      btn.type='button';
      btn.addEventListener('click',()=>{
        const frame=create('iframe');
        frame.src=`https://www.youtube-nocookie.com/embed/${found}`;
        frame.title=`Video related to ${heading}`;
        frame.loading='lazy';frame.allowFullscreen=true;
        frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        btn.replaceWith(frame);
      });
      wrap.append(btn);
    }else{
      wrap.append(create('p','', 'Find related educational videos on YouTube. Results are not curated by FactForge.'));
      const a=create('a','', '▶ Search YouTube for this topic ↗');
      a.href='https://www.youtube.com/results?search_query='+encodeURIComponent(heading);
      a.target='_blank';a.rel='noopener noreferrer';
      wrap.append(a);
    }
    post.append(wrap);
  }
  function addSources(prose, record){
    if(!Array.isArray(record.sources) || !record.sources.length) return;
    const section=create('section','ff-sources');
    section.append(create('h2','', 'Further reading & sources'));
    const list=create('ul');
    record.sources.forEach(source=>{
      if(!source || !source.title || !source.url)return;
      try{
        const u=new URL(source.url);
        if(u.protocol!=='https:')return;
        const li=create('li'),a=create('a','',source.title);
        a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';
        li.append(a);list.append(li);
      }catch(_){}
    });
    if(list.children.length){section.append(list);prose.append(section);}
  }
  function buildPost(data, articles) {
    const post = document.querySelector('main.post-wrap article');
    const prose = post?.querySelector('.post-prose');
    const heading = post?.querySelector('.post-heading');
    if(!prose || !heading) return;
    const slug = slugOf(location.href);
    const record = data[slug] || {};
    const title = heading.querySelector('h1')?.textContent?.trim() || slug.replace(/-/g,' ');
    const category = [...heading.classList].find(cls=>cls.startsWith('cat-'))?.slice(4) || 'knowledge';
    const images = selectImages(category,slug,record.images);
    const style = create('link');style.rel='stylesheet';style.href=root('reader-upgrade.css');document.head.append(style);
    if(record.deck) heading.insertAdjacentElement('afterend',create('p','ff-deck',record.deck));
    if(images.length) {
      const hero=figure(images[0],true);
      (heading.nextElementSibling?.classList.contains('ff-deck') ? heading.nextElementSibling : heading).insertAdjacentElement('afterend',hero);
    }
    if(Array.isArray(record.takeaways) && record.takeaways.length){
      const snap=create('aside','ff-snapshot');
      snap.append(create('h2','', 'The big ideas'));
      const list=create('ul');
      record.takeaways.forEach(text=>list.append(create('li','',text)));
      snap.append(list);prose.prepend(snap);
    }
    const sections = Array.isArray(record.sections) ? record.sections.filter(s=>s && s.heading && Array.isArray(s.paragraphs)) : [];
    if(sections.length > 1){
      const toc=create('nav','ff-toc');toc.setAttribute('aria-label','Article sections');
      toc.append(create('h2','', 'In this guide'));
      const list=create('ol');
      sections.forEach((section,i)=>{
        const li=create('li'),a=create('a','',section.heading);
        a.href='#section-'+(i+1)+'-'+escId(section.heading);
        li.append(a);list.append(li);
      });
      toc.append(list);prose.prepend(toc);
    }
    let photoIndex=1;
    sections.forEach((section,i)=>{
      const el=create('section','ff-section');
      const h=create('h2','',section.heading);
      h.id='section-'+(i+1)+'-'+escId(section.heading);
      el.append(h);
      section.paragraphs.forEach(text=>el.append(create('p','',text)));
      if(Array.isArray(section.bullets) && section.bullets.length){
        const list=create('ul');section.bullets.forEach(t=>list.append(create('li','',t)));el.append(list);
      }
      if(section.quote)el.append(create('blockquote','',section.quote));
      prose.append(el);
      const placement=[2,5,8,11];
      if(placement.includes(i) && photoIndex < images.length){
        prose.append(figure(images[photoIndex++]));
      }
    });
    if(photoIndex < images.length){
      const gallery=create('div','ff-photo-grid');
      gallery.setAttribute('aria-label','Article photo gallery');
      while(photoIndex<images.length){ gallery.append(figure(images[photoIndex++])); }
      prose.append(gallery);
    }
    const original = articles.find(item => item.slug === slug);
    const originalCount = original?.words || countWords([...prose.querySelectorAll(':scope > p')].map(p=>p.textContent).join(' '));
    const actualCount = originalCount + upgradedWords(record);
    const minutes=Math.max(1,Math.ceil(actualCount / 200));
    const meta=heading.querySelector('.post-meta');
    if(meta) meta.textContent=meta.textContent.replace(/\d+\s*min read/i,`${minutes} min read`);
    const eyebrow=heading.querySelector('.eyebrow');
    if(eyebrow && minutes >= 10) eyebrow.textContent=eyebrow.textContent.replace(/SHORT READ/i,'LONG-FORM GUIDE');
    addVideo(prose,title,record);
    addSources(prose,record);
    const actions=create('div','ff-actions');
    const copy=create('button','', '⤴ Copy article link');copy.type='button';
    copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);copy.textContent='✓ Link copied';}catch(_){copy.textContent='Copy the URL in your address bar';}});
    const print=create('button','', '⎙ Print article');print.type='button';print.addEventListener('click',()=>window.print());
    actions.append(copy,print);prose.append(actions);
    addProgress();
  }
  Promise.all([fetchJson('articles.json'),fetchJson('post-content.json')]).then(([articles,content])=>{
    if(!Array.isArray(articles)) articles=[];
    if(!content || Array.isArray(content) || typeof content!=='object') content={};
    if(document.querySelector('main.post-wrap article')) buildPost(content,articles);
    if(document.querySelector('#fact-search')) updateHome(articles,content);
  });
})();
// FACTFORGE HOMEPAGE READING-TIME FIX
(() => {
  if (!document.querySelector(".card")) return;
  const scriptURL = document.currentScript?.src || location.href;
  const words = value => String(value || "").trim().split(/\s+/).filter(Boolean).length;
  const expandedWords = record => {
    if (!record || !Array.isArray(record.sections)) return 0;
    return words(record.deck)
      + (record.takeaways || []).reduce((n, x) => n + words(x), 0)
      + record.sections.reduce((n, s) =>
          n + words(s.heading) + words(s.quote)
          + (s.paragraphs || []).reduce((m, x) => m + words(x), 0)
          + (s.bullets || []).reduce((m, x) => m + words(x), 0), 0);
  };
  const load = filename => fetch(new URL(filename, scriptURL), { cache: "no-store" })
    .then(r => r.ok ? r.json() : null).catch(() => null);
  Promise.all([load("articles.json"), load("post-content.json")]).then(([articles, content]) => {
    const originals = new Map((Array.isArray(articles) ? articles : [])
      .filter(a => a && a.slug).map(a => [a.slug, a]));
    document.querySelectorAll(".card").forEach(card => {
      const link = card.querySelector("a.article-link[href], h3 a[href], a[href*='posts/']");
      const label = card.querySelector(".card-kicker");
      if (!link || !label) return;
      const slug = decodeURIComponent(new URL(link.href, location.href).pathname
        .split("/").pop()).replace(/\.html$/i, "");
      const original = originals.get(slug);
      const baseWords = Number(original?.words) ||
        words((original?.paragraphs || []).join(" "));
      const total = baseWords + expandedWords(content?.[slug]);
      if (!total) return;
      const minutes = Math.max(1, Math.ceil(total / 200));
      label.textContent = label.textContent.replace(/\b\d+\s*min(?:ute)?s?\s*read\b/i,
        `${minutes} MIN READ`);
    });
  });
})();
