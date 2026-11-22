# FactForge — Long-Form Blog Upgrade

Built for **https://mysticjason165.github.io/factforge/** and its public GitHub Pages repository `mysticjason165/factforge` (checked November 22, 2026).

## What this package actually does

- Works with all **125 existing blog pages** without requiring you to replace the individual HTML pages.
- Adds **4 starter photos per blog** (the system allows **3–5 custom photos per blog**), using category-matched Unsplash images. Starter photos are shared across multiple posts, not 500 unique licensed files. The images require an internet connection and their availability should be checked.
- Adds an optional **YouTube embed** when a real video URL is entered. Otherwise shows a clear link to **search YouTube** for the article's topic, not an invented or randomly selected video.
- Adds a clickable **table of contents**, summary box, reading progress bar, share-link button, print button, and further reading links where provided.
- Keeps your original site design, dark mode, homepage search, category filters, pagination, and existing URLs.
- Calculates reading time from the **actual word count** at approximately **200 words per minute**, including any long-form sections. It does *not* pretend a 140-word post is a 10-minute read.
- Includes two complete long-form example guides: **Start a Campus Side Hustle by Solving One Small Problem** (~14 minutes) and **Give Sleep a Place in Your Schedule** (~13 minutes), with a verified Cleveland Clinic YouTube video for the sleep guide.
- Includes a browser-based editor and an optional AI draft generator for expanding the remaining 123 posts.

**IMPORTANT:** I did NOT write 125 complete 2,000–4,000-word articles in this package. The new reading layout and four photos apply to all 125 right away, but the other 123 articles stay short until you add substantive text. Expanding the other 123 requires editorial work or running the optional generator and reviewing its output. The original 125 HTML files and `articles.json` remain yours, untouched.

## A. Publish the visual upgrade (quickest route)

1. Download and **unzip** the supplied ZIP file. (Do not upload the ZIP as-is to GitHub.)
2. Open your repository: https://github.com/mysticjason165/factforge
3. Open the **root** folder on the `main` branch (where `index.html`, `script.js` and `articles.json` are).
4. **Replace the current `script.js`** with the `script.js` from this package. GitHub's web editor lets you edit an existing file; alternatively upload all the files from a local clone and commit.
5. Upload these **three new files** beside `script.js`:
   - `reader-upgrade.js`
   - `reader-upgrade.css`
   - `post-content.json`
6. Commit the changes. Let GitHub Pages update, then hard refresh your website.
7. Open these two articles and verify their longer text, 4 images, calculated reading times, and video:
   - https://mysticjason165.github.io/factforge/posts/start-a-campus-side-hustle-by-solving-one-small-problem.html
   - https://mysticjason165.github.io/factforge/posts/give-sleep-a-place-in-your-schedule.html
8. Open any other post: it will have four starter photos and a YouTube search link, but will keep its honest, shorter read time until you write the longer sections.

**Files to publish:** `script.js`, `reader-upgrade.js`, `reader-upgrade.css`, `post-content.json`. Nothing else is needed for the visual upgrade. **Do not replace your existing `articles.json`, index.html, style.css or posts directory** — this package relies on them.

> If GitHub won't replace an existing file by upload, click your existing `script.js` > pencil icon > paste the text from this package > Commit changes. Create/upload the other three files using Add file > Upload files.

## B. Edit one article without writing code

The included `EDIT-POSTS.html` is a local editing tool; **keep it on your computer** rather than publishing it.

1. Put it in a local copy of the FactForge repository beside `articles.json` and `post-content.json`.
2. From that folder, run: `python -m http.server 8000`
3. Open `http://localhost:8000/EDIT-POSTS.html` in your browser.
4. Select an article from the dropdown. Add a summary, sections, 3–5 photo URLs (optional), and a real YouTube link (optional).
5. Click **Save this article**, then **Download post-content.json**.
6. Upload that **new `post-content.json`** to GitHub (replace the previous version).

If the editor is opened directly from your files rather than through a web server, use the file pickers to select `articles.json` and `post-content.json` yourself.

### How the JSON format works

Add a new entry using the exact slug from `articles.json`:

```json
{
  "your-existing-post-slug": {
    "deck": "An introductory sentence that invites a longer read.",
    "takeaways": ["First practical takeaway", "Second practical takeaway"],
    "sections": [
      {
        "heading": "What to understand first",
        "paragraphs": [
          "Write a detailed, useful paragraph here.",
          "Add another detailed paragraph, with a concrete example."
        ],
        "bullets": ["An optional useful checklist item"]
      }
    ],
    "youtubeUrl": "https://www.youtube.com/watch?v=REAL_VIDEO_ID",
    "images": [
      {"src": "https://your-image-host/image-one.jpg", "alt": "Accurate description of image one", "caption": "Optional caption"},
      {"src": "https://your-image-host/image-two.jpg", "alt": "Accurate description of image two"},
      {"src": "https://your-image-host/image-three.jpg", "alt": "Accurate description of image three"}
    ],
    "sources": [
      {"title": "A verified source", "url": "https://example.com/a-real-source"}
    ]
  }
}
```

Don't overwrite the two completed examples when you add a new entry: you can merge entries using the editor or edit the JSON as an object.

## C. Expand the remaining 123 articles with AI drafts (optional)

`expand_all.py` can generate long-form **drafts** from your existing short articles, one by one. It saves progress after each post so you can stop and resume. It targets **2,000+ total words**, which reads about 10+ minutes at 200 words per minute. Results vary by model: some drafts will require adding or trimming material. Fact-check everything before publishing, especially health and safety claims.

1. Download a complete local copy of your **existing GitHub repository**, so that `articles.json` is in the same folder as `expand_all.py` and `post-content.json`.
2. Install Python 3.10 or later.
3. Choose one provider:
   - **Local / no API fee**: install Ollama separately, download a capable instruction model (example: `ollama pull llama3.1`), and start Ollama; then run `python expand_all.py --provider ollama --model llama3.1`.
   - **OpenAI API / usage-based fees**: set `OPENAI_API_KEY` as a local environment variable, then run `python expand_all.py --provider openai --model gpt-4.1-mini`. This is a paid API service separate from ChatGPT Plus. **Never paste your API key into a website or GitHub repository.** Model availability and prices may change.
4. To inspect what needs writing without making any model calls, run: `python expand_all.py --dry-run`.
5. To test just one article first, run: `python expand_all.py --provider ollama --limit 1`.
6. The script writes drafts to `post-content.json`. Review accuracy, original claims, usability, and reading time, add relevant verified sources and YouTube videos, then upload the JSON file to GitHub.

The generator is not required for either starter article or for your new galleries / video links. Local generation can require a powerful computer and take time; model-generated long articles need human editing to avoid repetition or false claims.

## D. Change photos and YouTube videos

`post-content.json` supports `images` with 3, 4, or 5 entries. Each image has its own URL, alt text, and optional caption. Use images that you have a right to publish. If you do not supply custom images, the site chooses **four** shared, category-appropriate Unsplash starter images using the article's slug. Avoid describing unrelated stock photos as if they show real people, organizations, or events from your story.

`youtubeUrl` accepts real `https://www.youtube.com/watch?v=...`, `https://youtu.be/...`, and supported Shorts links. When supplied, the site shows a click-to-load privacy-enhanced video embed. If omitted, readers get a topical YouTube search link, **not** a specific video recommendation. Always verify rights, relevance, video availability, and embed permissions.

## E. Verify before sharing widely

- On your phone, check article layouts, gallery images, captions, YouTube playback and dark mode.
- Make sure the content length matches the displayed reading time; do not fill space with repetitive text.
- Review every health/safety claim and add source links where possible.
- Check that photos load reliably. Unsplash photo availability is external and may change. You can replace all starter photos with your own hosted photos at any time.
- Important SEO note: this upgrade adds long-form article text **with JavaScript**. Google can render JavaScript, but server-rendered or pre-generated static article HTML is generally more robust across crawlers. For a future fully SEO-optimized version, build the expanded content into the static HTML files during publishing.

## Reverting

To revert the site to its earlier version, restore the previous `script.js` from your GitHub commit history. The other three upgrade files can stay unused or be deleted. Your original 125 post HTML files are untouched by this package.

## Sources checked while making the starter guides

- CDC: https://www.cdc.gov/sleep/about/index.html
- U.S. Small Business Administration: https://www.sba.gov/counseling/plan-your-business/
- Cleveland Clinic YouTube: https://www.youtube.com/watch?v=mpwBpNhal_M
- Unsplash licensing: https://help.unsplash.com/en/articles/2612315-can-i-use-unsplash-images-for-personal-or-commercial-projects
- YouTube embedded player: https://developers.google.com/youtube/player_parameters

This package is an independent upgrade prepared for your public FactForge site; it is not affiliated with or endorsed by those sources.
