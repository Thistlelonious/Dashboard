import { expect } from "@playwright/test"

export default async function backup({ page, open, shot, evidence }) {
  await open("#/")
  await expect(page.locator("aside.sas-panel")).toContainText("No backup yet")
  await shot("banner")

  await open("#/setup")
  const download = page.waitForEvent("download")
  await page.getByRole("button", { name: "Send backup" }).click()
  const file = `${evidence}/${(await download).suggestedFilename()}`
  await (await download).saveAs(file)
  await expect(page.locator("aside.sas-panel")).toHaveCount(0)
  await shot("sent")

  const chooser = page.waitForEvent("filechooser")
  await page.getByRole("button", { name: "Merge backup" }).click()
  await (await chooser).setFiles(file)
  await expect(page.getByText(/^\d+ added, \d+ updated, \d+ unchanged$/)).toBeVisible()
  await shot("merge-preview")
  await page.getByRole("button", { name: "Merge", exact: true }).click()
  await expect(page.getByRole("status")).toHaveText(/^Merged\. 0 added, 0 updated, \d+ unchanged$/)
  await shot("merged")
}
