import { appAcceptance } from "../src/app/app-acceptance-data";
import { expectToolcraftAcceptanceOutcome } from "./browser-acceptance-outcome-helpers";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { expect, test } from "./toolcraft-product-test";

test("browser: Reset restores native Hero defaults without publication", async ({ page }) => {
  const acceptance = appAcceptance.find(entry => entry.id === "website.settings");
  if (!acceptance) throw new Error("Missing website.settings acceptance.");
  const requests: string[] = [];
  page.on("request", request => requests.push(request.url()));
  await page.goto("/");
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Apply", exact: true })).toHaveCount(0);
  const color = page.getByRole("textbox", { name: "Text color hex", exact: true });
  await color.fill("#FF0000");
  await color.press("Enter");
  await expect(color).toHaveValue("#FF0000");
  const websiteAction = await getToolcraftControlFieldByTarget(page, "website.settings");
  await expectToolcraftAcceptanceOutcome(
    () => color.inputValue(),
    () => websiteAction.getByRole("button", { name: "Reset", exact: true }).click(),
    { evidenceType: "command-side-effect", requirementId: acceptance.id },
  );
  await expect(color).toHaveValue("#D2FC31");
  const origin = new URL(page.url()).origin;
  expect(requests.filter(url => /^https?:/.test(url) && new URL(url).origin !== origin)).toEqual([]);
  expect(requests.filter(url => /save-settings|save-result|\/api\//.test(url))).toEqual([]);
});
