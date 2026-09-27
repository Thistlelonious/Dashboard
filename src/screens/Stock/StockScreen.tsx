import { useState, type FormEvent } from "react"
import { Choices } from "../../design/Choices.tsx"
import { Field } from "../../design/Field.tsx"
import { Icon } from "../../design/Icon.tsx"
import { Table } from "../../design/Table.tsx"
import { localDate } from "../../dates.ts"
import { replay, type Stock } from "../../inventory/ledger.ts"
import { unitName, units } from "../../inventory/units.ts"
import { domains, type DomainId } from "../../pricing/domains/index.ts"
import type { InventoryItem } from "../../storage/db.ts"
import { store, type Inventory } from "../../storage/store.ts"
import { useStored } from "../../storage/useStored.ts"
import { formatQty, formatUnitCost } from "./format.ts"
import { matchItem, parseAdjust, parsePurchase, type AdjustForm, type Errors, type PurchaseForm } from "./stockForms.ts"

export function StockScreen() {
  const inventory = useStored(() => store.inventory(), "inventory")
  return (
    <>
      <header className="sas-panel">
        <h1 className="sas-display">Stock</h1>
      </header>
      <section className="sas-panel sas-stack">
        <h2 className="sas-title">Items</h2>
        {inventory !== undefined && <Items inventory={inventory} />}
      </section>
      {inventory !== undefined && <AddPurchase items={inventory.items} />}
      {inventory !== undefined && inventory.items.length > 0 && <AdjustStock items={inventory.items} />}
    </>
  )
}

export function OnHand({ stock, unit }: { stock: Stock; unit: string }) {
  if (!stock.short) return <>{formatQty(stock.qty, unit)}</>
  return (
    <span className="sas-actions">
      <Icon name="alert" />
      Short by {formatQty(-stock.qty, unit)}
    </span>
  )
}

export function AverageCost({ stock, unit }: { stock: Stock; unit: string }) {
  return <>{stock.averageCost === null ? "No purchases" : formatUnitCost(stock.averageCost, unit)}</>
}

function Items({ inventory }: { inventory: Inventory }) {
  if (inventory.items.length === 0) return <p>Add a purchase to start.</p>
  const stock = replay(inventory.items, inventory.purchases, inventory.uses)
  const categories = Map.groupBy(
    inventory.items.toSorted((a, b) => a.name.localeCompare(b.name)),
    (item) => item.category,
  )
  return (
    <>
      {[...categories].sort(([a], [b]) => a.localeCompare(b)).map(([category, items]) => (
        <div key={category} className="sas-stack sas-stack--tight">
          <h3 className="sas-heading">{category}</h3>
          <Table
            columns={[{ label: "Item" }, { label: "On hand", num: true }, { label: "Average cost", num: true }]}
            rows={items.map((item) => {
              const itemStock = stock.get(item.id) ?? { qty: 0, averageCost: null, short: false }
              return {
                key: item.id,
                cells: [
                  <a className="sas-button sas-button--outline" href={`#/stock/${item.id}`}>
                    {item.name}
                  </a>,
                  <OnHand stock={itemStock} unit={item.unit} />,
                  <AverageCost stock={itemStock} unit={item.unit} />,
                ],
              }
            })}
          />
        </div>
      ))}
    </>
  )
}

function useForm<Form extends Record<string, string>>(start: Form) {
  const [form, setForm] = useState(start)
  const [errors, setErrors] = useState<Errors<Form>>({})
  const field = (name: keyof Form & string) => ({
    value: form[name],
    error: errors[name],
    onChange: (value: string) => {
      setForm((current) => ({ ...current, [name]: value }))
      setErrors((current) => ({ ...current, [name]: undefined }))
    },
  })
  return { form, setForm, errors, setErrors, field }
}

function submitted(handle: () => void) {
  return (event: FormEvent) => {
    event.preventDefault()
    handle()
  }
}

type PurchaseText = Omit<PurchaseForm, "domain">

function AddPurchase({ items }: { items: InventoryItem[] }) {
  const today = localDate(new Date())
  const blank: PurchaseText = { item: "", category: "", unit: "", conversion: "", qty: "", total: "", vendor: "", date: today }
  const { form, setForm, setErrors, field } = useForm(blank)
  const [domain, setDomain] = useState<DomainId>("sewing")
  const [added, setAdded] = useState<string>()
  const existing = matchItem(items, form.item)

  function add() {
    const parsed = parsePurchase({ ...form, domain }, items)
    if (!parsed.ok) {
      setErrors(parsed.errors)
      setAdded(undefined)
      return
    }
    void store.addPurchase(parsed.value)
    setAdded(`Added ${formatQty(parsed.value.qty, parsed.value.unit)} of ${form.item.trim()}.`)
    setForm({ ...blank, vendor: form.vendor, date: form.date })
  }

  return (
    <section className="sas-panel sas-stack">
      <h2 className="sas-title">Add purchase</h2>
      <form className="sas-stack" onSubmit={submitted(add)}>
        <div className="sas-grid">
          <Field label="Item" {...field("item")} suggestions={items.map((item) => item.name)} />
          {existing === undefined ? (
            <Field
              label="Category"
              {...field("category")}
              suggestions={[...new Set(items.map((item) => item.category))]}
            />
          ) : (
            <p>
              Adds to {existing.name}, counted in {unitName(existing.unit, "plural")}.
            </p>
          )}
        </div>
        {existing === undefined && (
          <Choices
            label="Craft"
            options={Object.values(domains).map((option) => ({
              key: option.id,
              label: option.label,
              checked: domain === option.id,
              select: () => setDomain(option.id),
            }))}
          />
        )}
        <div className="sas-grid">
          <Field label="Quantity" {...field("qty")} inputMode="decimal" />
          <Field label="Unit" {...field("unit")} suggestions={Object.keys(units)} />
          <Field label="Total paid" {...field("total")} prefix="$" inputMode="decimal" />
          {existing === undefined && <Field label="Conversion" {...field("conversion")} />}
          <Field label="Vendor" {...field("vendor")} />
          <Field label="Date" {...field("date")} />
        </div>
        <div className="sas-actions">
          <button className="sas-button" type="submit">
            <Icon name="plus" />
            Add purchase
          </button>
        </div>
        {added !== undefined && <p role="status">{added}</p>}
      </form>
    </section>
  )
}

function AdjustStock({ items }: { items: InventoryItem[] }) {
  const blank: AdjustForm = { item: "", qty: "", unit: "", date: localDate(new Date()) }
  const { form, setForm, setErrors, field } = useForm(blank)
  const [adjusted, setAdjusted] = useState<string>()

  function adjust() {
    const parsed = parseAdjust(form, items)
    if (!parsed.ok) {
      setErrors(parsed.errors)
      setAdjusted(undefined)
      return
    }
    void store.adjustStock(parsed.value)
    setAdjusted(`Took ${formatQty(parsed.value.qty, parsed.value.unit)} of ${form.item.trim()} out of stock.`)
    setForm({ ...blank, date: form.date })
  }

  return (
    <section className="sas-panel sas-stack">
      <h2 className="sas-title">Adjust stock</h2>
      <p>Record waste or personal use.</p>
      <form className="sas-stack" onSubmit={submitted(adjust)}>
        <div className="sas-grid">
          <Field label="Item" {...field("item")} suggestions={items.map((item) => item.name)} />
          <Field label="Quantity" {...field("qty")} inputMode="decimal" />
          <Field label="Unit" {...field("unit")} suggestions={Object.keys(units)} />
          <Field label="Date" {...field("date")} />
        </div>
        <div className="sas-actions">
          <button className="sas-button sas-button--tonal" type="submit">
            <Icon name="check" />
            Adjust
          </button>
        </div>
        {adjusted !== undefined && <p role="status">{adjusted}</p>}
      </form>
    </section>
  )
}
