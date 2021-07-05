//It will create ExpressError and throw it to middleware. 
class ExpressError extends Error {
    constructor(message, status)
    {
        super();
        this.message = message;
        this.status = status;
    }
}

module.exports = ExpressError;
