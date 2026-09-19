import { test } from './toolcraft-product-test';
import { expectToolcraftProductObservableToChange } from './product-observable-helpers';
import { expectToolcraftReferenceParity } from './browser-acceptance-outcome-helpers';
import { openFlame, fieldValue } from './flame-test-helpers';

test('browser: flame background color changes output',async({page})=>{
 const session=await openFlame(page);
 await expectToolcraftProductObservableToChange(session,session.controlAction('appearance.background',async()=>fieldValue(page,'appearance.background','#123456')),{requirementId:'appearance.background',selector:'[data-toolcraft-editable-canvas]'});
 await expectToolcraftReferenceParity(()=>page.getByRole('textbox',{name:'Background color hex'}).inputValue(),'#123456',{requirementId:'appearance.background',target:'appearance.background'});
});
