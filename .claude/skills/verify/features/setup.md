# Setup

The Setup screen edits the business settings and keeps the setup checklist. It also holds the Backup section, which `backup.md` covers.

## Sub-features

- `settings-edit` saves the business name, tax rate, deposit, and valid days as you type.
- `settings-invalid` shows a message for a value that doesn't parse and keeps the last good one.
- `checklist-tick` ticks a seeded or added item.
- `checklist-add` adds your own item with an optional reason.
- `checklist-delete` deletes your own item. Seeded items can't be deleted.

## How to get to it (user POV)

- Choose the Setup tile on Home, or open `#/setup`.
- Choose "Back up" on the backup banner.

## Driving it with drive.mjs

Preconditions:

- The baseline state.

- **Settings.** Fill "Business name", "Tax rate", "Deposit", and "Estimates valid for". Reload, and each field shows the saved value.
- **Invalid value.** Fill "Deposit" with 150. The field shows "Use a number up to 100, like 50", and after a reload it shows the last good value.
- **Tick.** Check the checkbox named "Get a California seller's permit from CDTFA.". It stays checked after a reload.
- **Add.** Fill "Item" with "Order business cards" and click "Add item". A checkbox with that name appears, with a "Delete" button under it.
- **Delete.** Click that item's "Delete". The item is gone after a reload.

## Gotchas

- Only your own items have a "Delete" button, so `getByRole("button", { name: "Delete" })` counts your items.
- Adding an empty item shows "Enter an item, like Order business cards".
