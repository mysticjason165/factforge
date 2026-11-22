FACTFORGE HOMEPAGE READING-TIME FIX

Issue: Blog post pages show updated durations (for example 14 min), but homepage cards may still say 1 MIN READ because the original homepage HTML has a fixed label.

1. Open https://github.com/mysticjason165/factforge
2. In the main/root folder, open reader-upgrade.js.
3. Click Edit (pencil), replace its contents with the included reader-upgrade.js and commit to the SAME branch GitHub Pages uses.
4. Leave your existing script.js, post-content.json, article pages, and all other files in place.
5. After the GitHub Pages workflow completes, refresh the home page with Ctrl + Shift + R.
6. Check the two expanded guides. Home and post page durations should now agree (minor variations are possible if articles.json is out of sync with the HTML).

Only the campus side hustle and sleep articles are expanded in the starter package. Other articles still have about one minute of actual text. This fix does not pretend they are all 10-20-minute reads.

If the homepage still says 1 MIN READ for a clearly longer article, check that it actually uses the newest reader-upgrade.js by opening https://mysticjason165.github.io/factforge/reader-upgrade.js and searching for "Some older FactForge cards". If it doesn't, the published JS is an older copy.
