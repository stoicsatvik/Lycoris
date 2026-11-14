# Lycoris homepage: moonlit theme

A restyled copy of the live Lycoris page (https://lycoris.buildwithsatvik.workers.dev/), built on top of a snapshot taken on 2026-11-15. The source of the live page was not in this repository on that date, so this folder holds a ready-to-serve page plus the script that produced it.

## Files

| File | What it is |
|---|---|
| `index.html` | The page to serve. The live page's markup and scripts, with the changes listed below |
| `theme-kaguya.css` | The theme layer. Loaded after the page's own styles; it only restyles them |
| `build.pl` | Rebuilds `index.html` from a snapshot of the live page: `perl build.pl snapshot.html > index.html`. It stops with an error if the live page no longer matches |

## What changed

- **Theme:** night-sky indigo with a sparse star field, moon-gold accents, cyan values and pink highlights. Mars keeps its own colour.
- **Type:** Fraunces for headlines (the last two words in italic gold), IBM Plex Sans and Mono for text and labels.
- **Navigation:** the SIMULATE button, which had no action, and the status text are replaced by links to Helmet HUD, Research and Experimental Claire. These open the Mars Atlas pages at https://anonymoussouss-max.github.io/Mars-Atlas/.
- **Homepage:** a numbered index strip (Plan a traverse, Helmet HUD, Experimental Claire), corner brackets around the globe, a zoom button that opens the mission map, a "Preview helmet HUD" link and a coordinates line down the left edge.
- **Moons:** the two orbit rings are labelled Phobos and Deimos.
- **Motion switch:** stops and starts the globe's rotation. It starts off for visitors who ask their system for reduced motion.

## What did not change

The three.js globe, the zoom into the mission map, the Leaflet map with NASA Mars Trek tiles, the simulation panel and all of its numbers.

## To deploy

Serve `index.html` and `theme-kaguya.css` from the same path. To inline the theme, replace the `<link rel="stylesheet" href="theme-kaguya.css">` tag in `index.html` with a `<style>` block holding the file's contents.

## Not checked

- Phone and tablet layouts.
- The Play and Reset controls after the restyle.
