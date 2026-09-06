'use strict';
(() => {
 const themeButton=document.querySelector('.theme-toggle');
 function setTheme(dark){document.body.classList.toggle('dark',dark);themeButton?.setAttribute('aria-pressed',String(dark));if(themeButton)themeButton.querySelector('span').textContent=dark?'Light mode':'Dark mode';}
 try{setTheme(localStorage.getItem('factforge-theme')==='dark');}catch(_){setTheme(false);}
 themeButton?.addEventListener('click',()=>{const dark=!document.body.classList.contains('dark');setTheme(dark);try{localStorage.setItem('factforge-theme',dark?'dark':'light');}catch(_){};});
 const search=document.querySelector('#fact-search');
 if(!search)return;
 const cards=[...document.querySelectorAll('.card')];
 const categories=['all','college','wellbeing','health','knowledge','mindset'];
 const labels={all:'all topics',college:'College & Work',wellbeing:'Wellbeing',health:'Health & Movement',knowledge:'Knowledge & Safety',mindset:'Mindset'};
 const params=new URLSearchParams(location.search);
 let category=categories.includes(params.get('category'))?params.get('category'):'all';
 let page=1;
 const size=12;
 search.value=params.get('q')||'';
 const clear=document.querySelector('#clear-filters');
 const pagination=document.querySelector('.pagination');
 const previous=document.querySelector('#previous-page');
 const next=document.querySelector('#next-page');
 function render(updateUrl=true){
  const query=search.value.trim().toLowerCase();
  const matches=cards.filter(card=>(category==='all'||card.dataset.category===category)&&card.dataset.search.toLowerCase().includes(query));
  const pages=Math.max(1,Math.ceil(matches.length/size));
  page=Math.min(Math.max(1,page),pages);
  cards.forEach(card=>card.hidden=true);
  matches.slice((page-1)*size,page*size).forEach(card=>card.hidden=false);
  document.querySelector('#results-status').textContent=matches.length?`${matches.length} ${matches.length===1?'post':'posts'} in ${labels[category]} · Showing ${(page-1)*size+1}–${Math.min(page*size,matches.length)}`:'No matching posts';
  document.querySelector('.empty-state').hidden=matches.length!==0;
  clear.hidden=category==='all'&&!query;
  pagination.hidden=pages<=1;
  previous.disabled=page===1;next.disabled=page===pages;
  document.querySelector('#page-status').textContent=`Page ${page} of ${pages}`;
  document.querySelectorAll('.navigation [data-category]').forEach(link=>{if(link.dataset.category===category)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  if(updateUrl){const p=new URLSearchParams();if(category!=='all')p.set('category',category);if(search.value.trim())p.set('q',search.value.trim());try{history.replaceState(null,'',location.pathname+(p.size?'?'+p.toString():'')+location.hash);}catch(_){};}
 }
 document.querySelectorAll('a[data-category]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();category=link.dataset.category;page=1;render();document.querySelector('#discover').scrollIntoView({block:'start'});}));
 search.addEventListener('input',()=>{page=1;render();});
 document.querySelector('.search').addEventListener('submit',event=>{event.preventDefault();page=1;render();});
 clear.addEventListener('click',()=>{category='all';search.value='';page=1;render();search.focus();});
 function turnPage(change){page+=change;render();document.querySelector('#discover').scrollIntoView({block:'start'});}
 previous.addEventListener('click',()=>turnPage(-1));next.addEventListener('click',()=>turnPage(1));
 const date=new Date();const day=Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000);
 const daily=cards[day%cards.length];
 document.querySelector('#daily-text').textContent=daily.querySelector('h3').textContent;
 document.querySelector('#daily-link').href=daily.querySelector('.article-link').getAttribute('href');
 document.querySelector('#daily-category').textContent=labels[daily.dataset.category];
 render(false);
})();
