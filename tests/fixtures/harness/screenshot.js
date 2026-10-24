import {test} from '/tests/harness.js';
import {command,screenshot} from '/tests/driver.js';
test('native screenshot artifact fixture',async()=>{
 await command('Emulation.setDeviceMetricsOverride',{width:960,height:720,deviceScaleFactor:1,mobile:false});
 try{return {screenshot:(await screenshot()).data};}finally{await command('Emulation.clearDeviceMetricsOverride');}
});
