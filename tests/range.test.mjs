import test from 'node:test';
import assert from 'node:assert/strict';
import {rangeValueAtPosition} from '../public/range-controls.js';
test('Deep Brush touch tracks clamp and round through the complete range',()=>{
 assert.equal(rangeValueAtPosition(-20,200,4,500),4);
 assert.equal(rangeValueAtPosition(220,200,4,500),500);
 assert.equal(rangeValueAtPosition(100,200,-180,180),0);
 assert.equal(rangeValueAtPosition(100,200,0,1,.25),.5);
 assert.equal(rangeValueAtPosition(200,200,0,1,.3),.9);
});
