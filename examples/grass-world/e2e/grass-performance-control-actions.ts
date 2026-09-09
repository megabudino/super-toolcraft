import type { Page } from "@playwright/test";

export function grassControl(page: Page, target: string) {
  return page.locator(`[data-toolcraft-control-target="${target}"]`);
}

export async function setGrassSliderValue(
  page: Page,
  target: string,
  value: number,
): Promise<void> {
  const wrapper = grassControl(page, target);
  const edit = wrapper.getByRole("button", { name: /^Edit .+ value$/u });
  if ((await edit.count()) > 0) {
    await edit.click();
    const editor = wrapper.getByRole("textbox");
    await editor.fill(String(value));
    await editor.press("Enter");
    return;
  }
  const slider = wrapper.getByRole("slider");
  await slider.evaluate((element, nextValue) => {
    const input = element as HTMLInputElement;
    input.value = String(nextValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

export async function toggleGrassSlider(
  page: Page,
  target: string,
): Promise<void> {
  const slider = grassControl(page, target).getByRole("slider");
  const current = Number(await slider.inputValue());
  const maximum = Number(await slider.getAttribute("max"));
  await slider.focus();
  await slider.press(current >= maximum ? "Home" : "End");
}

export async function chooseGrassOption(
  page: Page,
  target: string,
  option: string,
): Promise<void> {
  await grassControl(page, target).getByRole("combobox").click();
  await page
    .locator('[role="listbox"]:visible [role="option"]')
    .filter({ hasText: option })
    .click();
}

export async function toggleGrassSwitch(
  page: Page,
  target: string,
): Promise<void> {
  await grassControl(page, target).getByRole("switch").click();
}
