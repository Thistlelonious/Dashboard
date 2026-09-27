import { expect } from "@playwright/test"

export default async function projects({ page, open, shot }) {
  await open("#/")
  await page.locator("label.sas-field", { hasText: "Name" }).locator("input").fill("Lined skirt")
  await page.getByRole("radio", { name: "Sewing", exact: true }).click()
  await page.getByRole("radio", { name: "Plum", exact: true }).click()
  await page.getByRole("button", { name: "Start project" }).click()
  const card = page.getByRole("link", { name: "Lined skirt", exact: true })
  await expect(card).toBeVisible()
  await shot("created")

  await page.reload()
  await expect(card).toBeVisible()
  await expect(card.locator("ol.sas-stages > li.sas-stage")).toHaveCount(4)
  await shot("after-reload")

  await card.click()
  await expect(page).toHaveURL(/#\/price\/[0-9a-f-]{36}$/)
  await expect(page.locator(".sas-heading", { hasText: "Lined skirt" })).toBeVisible()
  await shot("opened")
}
