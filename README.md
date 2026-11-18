# Poke Doublerush

A roguelike double-battle Pokémon game that runs in the browser. Build with PokeAPI.

To play click the link= "https://isthisalif.github.io/Poke-Doublerush/"

## Files
- `index.html`: page shell and script/style loading order
- `css/base.css`: theme, buttons, boxes, party screen
- `css/battle.css`: battle scene, sprites, animations, tooltip, log
- `css/mobile.css`: phone layout
- `js/data.js`: constants, type chart, helpers, saved best score
- `js/pokemon.js`: builds Pokémon from PokéAPI (moves, abilities, items, forms)
- `js/screens.js`: title, party selection, victory and game over
- `js/battle-ui.js`: battle screen drawing and command menus
- `js/battle-engine.js`: turn order, damage, moves, abilities, gimmicks
- `js/tooltip.js`: hover and touch tooltips
- `js/main.js`: quit button and game start

The scripts are plain scripts, not modules, so they work when opened straight from disk. Keep the load order in `index.html`.
