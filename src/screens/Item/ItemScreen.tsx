import { Icon } from "../../design/Icon.tsx"
import { Table } from "../../design/Table.tsx"
import { replay } from "../../inventory/ledger.ts"
import { formatCents } from "../../money.ts"
import { store } from "../../storage/store.ts"
import { useStored } from "../../storage/useStored.ts"
import { formatQty, formatUnitCost } from "../Stock/format.ts"
import { AverageCost, OnHand } from "../Stock/StockScreen.tsx"

const reasons = { build: "Build", adjustment: "Adjustment" }

export function ItemScreen({ itemId }: { itemId: string }) {
  const inventory = useStored(() => store.inventory(), "inventory")
  if (inventory === undefined) return null
  const item = inventory.items.find((candidate) => candidate.id === itemId)
  if (item === undefined) {
    return (
      <>
        <header className="sas-panel">
          <h1 className="sas-display">Item</h1>
        </header>
        <section className="sas-panel sas-stack">
          <p>This item isn't on this device.</p>
          <div className="sas-actions">
            <a className="sas-button sas-button--outline" href="#/stock">
              <Icon name="arrow-left" />
              Stock
            </a>
          </div>
        </section>
      </>
    )
  }

  const stock = replay([item], inventory.purchases, inventory.uses).get(item.id) ?? { qty: 0, averageCost: null, short: false }
  const byDate = <Dated extends { date: string; updatedAt: string }>(a: Dated, b: Dated) =>
    a.date.localeCompare(b.date) || a.updatedAt.localeCompare(b.updatedAt)
  const purchases = inventory.purchases.filter((purchase) => purchase.itemId === item.id).sort(byDate)
  const uses = inventory.uses.filter((use) => use.itemId === item.id).sort(byDate)
  const conversion = item.crossConversion

  return (
    <>
      <header className="sas-panel sas-stack sas-stack--tight">
        <h1 className="sas-display">{item.name}</h1>
        <p>{item.category}</p>
      </header>
      <section className="sas-panel sas-stack sas-stack--tight">
        <h2 className="sas-title">On hand</h2>
        <p className="sas-subheading">
          <OnHand stock={stock} unit={item.unit} />
        </p>
        <p>
          Average cost <AverageCost stock={stock} unit={item.unit} />
        </p>
        {conversion !== undefined && (
          <p>
            1 {conversion.from} = {conversion.factor} {conversion.to}
          </p>
        )}
      </section>
      <section className="sas-panel sas-stack">
        <h2 className="sas-title">Purchases</h2>
        {purchases.length === 0 ? (
          <p>No purchases yet.</p>
        ) : (
          <Table
            columns={[
              { label: "Date" },
              { label: "Vendor" },
              { label: "Quantity", num: true },
              { label: "Landed cost", num: true },
              { label: "Unit cost", num: true },
            ]}
            rows={purchases.map((purchase) => ({
              key: purchase.id,
              cells: [
                purchase.date,
                purchase.vendor,
                formatQty(purchase.qty, purchase.unit),
                formatCents(purchase.landedCost),
                formatUnitCost(purchase.landedCost / purchase.qty, purchase.unit),
              ],
            }))}
          />
        )}
      </section>
      <section className="sas-panel sas-stack">
        <h2 className="sas-title">Uses</h2>
        {uses.length === 0 ? (
          <p>No uses yet.</p>
        ) : (
          <Table
            columns={[{ label: "Date" }, { label: "Quantity", num: true }, { label: "Reason" }]}
            rows={uses.map((use) => ({
              key: use.id,
              cells: [use.date, formatQty(use.qty, use.unit), reasons[use.reason]],
            }))}
          />
        )}
      </section>
    </>
  )
}
