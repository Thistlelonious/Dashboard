# Stock

The Stock screen lists every inventory item by category with its stock on hand and average cost, both worked out from purchases and uses. "Add purchase" records a purchase of a new or existing item, and "Adjust" records waste or personal use. Each item opens its own screen at `#/stock/<itemId>` with its purchases and uses.

## Sub-features

- `stock-list` groups items by category, with on hand and average cost per unit.
- `stock-purchase` adds a purchase, creating the item when the name is new.
- `stock-existing` adds to an item whose name matches, ignoring case, in any unit it converts from.
- `stock-adjust` takes a quantity out of stock.
- `stock-short` shows "Short by" when more was used than bought.
- `item-screen` shows on hand, average cost, the conversion, a purchase table with unit costs, and the uses.

## How to get to it (user POV)

- Choose the Stock tile on Home, or open `#/stock`.
- Choose an item's name button in the Stock table to open its screen.

## Driving it with drive.mjs

Preconditions:

- The baseline state, with no items. "Adjust stock" only shows once an item exists.

- **Add a new item.** In the "Add purchase" section, fill "Item" with "Bemberg lining", "Category" with "Fabric", "Quantity" 1, "Unit" yd, "Total paid" 6.00, "Vendor", and "Date", then click "Add purchase". The status reads "Added 1 yd of Bemberg lining." and the Fabric table row reads "Bemberg lining", "1 yd", "$6.00 per yard".
- **Add to it.** Fill "Item" with the same name. The form shows "Adds to Bemberg lining, counted in yards." and hides the new-item fields. Add 2 for 15.00. The row reads "3 yd" and "$7.00 per yard".
- **Adjust.** In "Adjust stock", fill "Item", "Quantity" 1, and "Date", then click "Adjust". The row reads "2 yd" at "$7.00 per yard".
- **Item screen.** Click the item's name button. The "Purchases" table shows each purchase's unit cost, such as "$6.00 per yard" and "$7.50 per yard", and "Uses" lists the adjustment.
- **Conversion.** A new item with "Conversion" set to "1 cup = 4.25 oz" shows that line under "On hand" on its screen.
- **Proof.** Reload and show the same rows. `tests/stock.spec.ts` runs the whole list, including a backup merged into a second browser context.

## Gotchas

- Both forms have an "Item" field. Scope `fill` to the section whose heading is "Add purchase" or "Adjust stock".
- The Craft radios only show for a new item.
- Dates are typed as `YYYY-MM-DD`, and the date field starts at today.
