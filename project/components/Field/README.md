A labeled text input with an optional unit and error message.

Use `<label class="sas-field">` with an `sas-field__label`, an `sas-field__control` holding the `sas-field__input` and an optional `sas-field__unit`, and an `sas-field__message`.

- The consumer provides the label, value, unit and message, and sets `data-state="error"` with `aria-invalid` and `aria-describedby` on the input.
- Errors show a thicker `danger` border, the `alert` icon and a plain message in `ink`, never color alone.
- Labels are always visible. Never use placeholder text as a label.
