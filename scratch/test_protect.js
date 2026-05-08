const path = require('path');
const authPath = path.resolve(__dirname, '../backend/middleware/authMiddleware');
const { protect } = require(authPath);

const req = {
    headers: {},
    cookies: {}
};
const res = {
    status: function(s) { this.statusCode = s; return this; },
    json: function(j) { console.log('JSON Output:', j); return this; }
};
const next = () => console.log('SUCCESS: Next called as a function');

console.log('Testing protect middleware...');
try {
    const middleware = protect('any');
    middleware(req, res, next);
} catch (err) {
    console.error('CRITICAL: Error executing middleware:', err);
}
