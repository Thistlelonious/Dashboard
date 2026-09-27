A row of round color chips for picking a thread or fabric color.

A `role="radiogroup"` of `sas-swatch` buttons, each with `role="radio"`, `data-hue`, `data-value` and `aria-label`, and a `check` icon inside.

- The consumer provides the options and listens for the `sas-change` event, which carries `detail.value`.
- The chosen chip gets an `ink` ring and shows its check. Arrow keys move the choice.
- Label the group with a visible `sas-field__label` and `aria-labelledby`.
