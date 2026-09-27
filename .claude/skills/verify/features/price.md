# Price

The Price screen works out how many hands-on minutes each stage can take to reach a price and margin, or the price that a number of minutes needs. With a project selected, every input saves to that project as you type.

## Sub-features

- `price-forward` shows the labor budget and each stage's minutes for a price.
- `price-reverse` shows the price for a number of minutes.
- `price-short` explains when the price can't reach the margin and shows the break-even price.
- `price-fit` removes Fit from a sewing project and adds it back.
- `price-project` renames or deletes the selected project.

## How to get to it (user POV)

- Choose the Price tile on Home for `#/price`, with no project selected.
- Choose a project card for `#/price/<projectId>`.

## Driving it with drive.mjs

Preconditions:

- For project behavior, a project created as in `projects.md`.

- **Skirt example.** Click the "Shopify online" radio, then fill "Price" 85, "Materials" 32, and "Overhead" 5 with the default $20 wage and 20% margin. The stage table's footer total reads "84.7 min".
- **Remove Fit.** Click "Remove Fit". The stage rows read Cut 19.9, Sew 44.8, and Finish 19.9 minutes. Click "Add Fit" to bring it back.
- **Rename.** Click "Rename", fill "Name", and click "Save". An empty name shows "Enter a name, like Skirt".
- **Delete.** Click "Delete", then "Delete for good". The app returns to Home, and the card is gone after a reload.
- **Proof.** Reload the project URL and show the same inputs and total.

## Gotchas

- The stage table is the `table.sas-table` whose header has a "Stage" cell. Under 600px wide, its rows stack into label and value pairs.
- "Delete" asks first. "Keep it" cancels.
- A deleted project's URL shows "This project isn't on this device. Nothing here is saved."
