'use strict';
const themeButton = document.querySelector('.theme-toggle');
function setTheme(dark) {
  document.body.classList.toggle('dark', dark);
  themeButton.setAttribute('aria-pressed', String(dark));
  themeButton.querySelector('span').textContent = dark ? 'Light mode' : 'Dark mode';
}
function darkMode() {
  const dark = !document.body.classList.contains('dark');
  setTheme(dark);
  try { localStorage.setItem('factforge-theme', dark ? 'dark' : 'light'); } catch (_) {}
}
try { setTheme(localStorage.getItem('factforge-theme') === 'dark'); } catch (_) { setTheme(false); }
themeButton.addEventListener('click', darkMode);
const searchInput = document.querySelector('#fact-search');
const cards = [...document.querySelectorAll('.card')];
const categoryLinks = [...document.querySelectorAll('[data-category]:not(.card)')];
const clearButton = document.querySelector('#clear-filters');
let currentCategory = 'all';
function filterFacts() {
  const query = searchInput.value.trim().toLowerCase();
  let count = 0;
  cards.forEach(card => {
    const matches = (currentCategory === 'all' || card.dataset.category === currentCategory) && (card.dataset.search + ' ' + card.textContent).toLowerCase().includes(query);
    card.hidden = !matches;
    if (matches) count++;
  });
  document.querySelector('#results-status').textContent = `${count} ${count === 1 ? 'fact' : 'facts'}${currentCategory === 'all' ? ' across all categories' : ' in ' + currentCategory}${query ? ' matching your search' : ''}`;
  document.querySelector('.empty-state').hidden = count !== 0;
  clearButton.hidden = currentCategory === 'all' && !query;
  document.querySelectorAll('.navigation [data-category]').forEach(link => {
    if (link.dataset.category === currentCategory) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}
categoryLinks.forEach(link => link.addEventListener('click', () => { currentCategory = link.dataset.category; filterFacts(); }));
searchInput.addEventListener('input', filterFacts);
document.querySelector('.search').addEventListener('submit', event => { event.preventDefault(); filterFacts(); });
clearButton.addEventListener('click', () => { currentCategory = 'all'; searchInput.value = ''; filterFacts(); });
const today = new Date();
const dayIndex = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000);
const dailyCard = cards[dayIndex % cards.length];
document.querySelector('#daily-text').textContent = dailyCard.querySelector('.card-body > p:not(.card-kicker)').textContent;
document.querySelector('#daily-category').textContent = dailyCard.dataset.category.toUpperCase();
filterFacts();
