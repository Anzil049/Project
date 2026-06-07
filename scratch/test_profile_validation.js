const { validationResult } = require('express-validator');
const { updateProfileValidator } = require('../backend/validators/profileValidators');

async function runValidation(body) {
    const req = { body };
    for (const middleware of updateProfileValidator) {
        await new Promise((resolve) => middleware(req, {}, resolve));
    }
    return validationResult(req).array();
}

async function runTests() {
    console.log('--- RUNNING VALIDATION TESTS ---');

    // Case 1: Valid facility
    const test1 = await runValidation({
        facilities: [
            {
                title: 'Advanced ICU',
                description: 'State of the art critical care unit',
                images: ['http://example.com/icu.jpg']
            }
        ]
    });
    console.log('Test 1 (Valid facility - Expect no errors):', test1.length === 0 ? 'PASS' : 'FAIL', test1);

    // Case 2: Missing title
    const test2 = await runValidation({
        facilities: [
            {
                description: 'State of the art critical care unit',
                images: ['http://example.com/icu.jpg']
            }
        ]
    });
    console.log('Test 2 (Missing title - Expect error):', test2.length > 0 && test2[0].msg.includes('must have a valid title') ? 'PASS' : 'FAIL', test2);

    // Case 3: Empty description
    const test3 = await runValidation({
        facilities: [
            {
                title: 'Advanced ICU',
                description: '   ',
                images: ['http://example.com/icu.jpg']
            }
        ]
    });
    console.log('Test 3 (Empty description - Expect error):', test3.length > 0 && test3[0].msg.includes('must have a valid description') ? 'PASS' : 'FAIL', test3);

    // Case 4: Empty images array
    const test4 = await runValidation({
        facilities: [
            {
                title: 'Advanced ICU',
                description: 'State of the art critical care unit',
                images: []
            }
        ]
    });
    console.log('Test 4 (Empty images array - Expect error):', test4.length > 0 && test4[0].msg.includes('must have at least one image') ? 'PASS' : 'FAIL', test4);

    // Case 5: Empty image string in array
    const test5 = await runValidation({
        facilities: [
            {
                title: 'Advanced ICU',
                description: 'State of the art critical care unit',
                images: ['']
            }
        ]
    });
    console.log('Test 5 (Empty image string - Expect error):', test5.length > 0 && test5[0].msg.includes('must be a valid URL') ? 'PASS' : 'FAIL', test5);
}

runTests().catch(console.error);
