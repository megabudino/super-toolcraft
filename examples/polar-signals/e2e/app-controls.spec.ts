import { expect,test } from './toolcraft-product-test';
import { openFlame } from './flame-test-helpers';
test('browser: flame graph opens in the Toolcraft shell',async({page})=>{
 await openFlame(page);
 await expect(page.getByRole('button',{name:'Regenerate',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Export PNG',exact:true})).toBeVisible();
 await expect(page.getByRole('application',{name:'Canvas viewport'})).toBeVisible();
});
