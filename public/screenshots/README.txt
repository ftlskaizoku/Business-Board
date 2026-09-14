Drop your captured screenshots in here, named exactly:

  dashboard.png
  stats.png
  vente.png
  catalogue.png

Each should be exactly 1080x1920 (portrait), PNG format — see the
"Application Android" / screenshots instructions from Claude for how to
capture these with Chrome DevTools' device toolbar.

The manifest.webmanifest file already references these four filenames, so
once you add the real PNGs here and redeploy, they'll show up automatically
in PWABuilder's report and in any install prompt that displays screenshots.

Until these files exist, nothing breaks — browsers just silently skip
missing screenshot entries.
