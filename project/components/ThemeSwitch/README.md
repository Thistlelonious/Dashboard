Three palette discs that switch between Light, Colorful and Dark.

A `role="radiogroup"` of three `sas-theme-switch__option` buttons, each with `data-sas-theme` and an `sas-theme-switch__disc` carrying the same `data-theme`.

- Each disc paints its own theme's colors, so people choose by what they see, not by reading.
- The chosen disc gets an `ink` ring and grows slightly. Arrow keys move between discs.
- The consumer provides nothing else. `bundle.js` handles clicks, keyboard, `aria-checked` and remembering the choice.
