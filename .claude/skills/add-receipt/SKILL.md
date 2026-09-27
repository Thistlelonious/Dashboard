---
name: add-receipt
description: Read a store receipt and turn its business purchases into an inventory import file. Use for "/add-receipt <path>", "add this receipt", or when the owner shares a receipt photo or PDF.
argument-hint: <path to a receipt in ../Files/Receipts-and-Sourcing, or attach the image>
model: sonnet
---

# Add a receipt

Source: $ARGUMENTS

Claude reads the receipt. The app does all cost math at import. Never allocate tax, shipping, or discounts yourself.

1. Read the receipt from the path, or from the image in the conversation. Record the path as `source`, or `chat` when there is no file.
2. Record the vendor, date, receipt number, subtotal, discount, shipping, tax, and total in cents. Never record card numbers, names, or loyalty numbers.
3. List every line with its raw text, quantity, and line total. If the lines do not add up to the subtotal, stop and show the gap.
4. Give each line a plain item name, a category, a domain (`sewing` or `pie`), and a unit from the unit families in `PLAN.md`. If a backup exists in `../Files/Backups`, reuse the item names from the newest one so repeat purchases join existing items.
5. Ask the owner about every line you cannot name with confidence. Show the raw text in one numbered list and wait for the answers. A line the owner calls personal gets `"skip": true`.
6. Write `imports/receipts/<date>_<vendor>.json` in the shape shown in `PLAN.md`. Build `receiptId` from the date, the vendor, and the receipt number, so a second import replaces the first.

Report the file path and a table of lines with name, quantity, unit, line total, and whether each is new, existing, or skipped.
