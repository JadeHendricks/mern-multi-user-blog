// Express 4 does not catch rejected promises from async handlers; forward them to the error middleware instead.
export default (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
