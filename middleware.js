const Users = require('./modals/user');
const Banks = require('./modals/bank');

//Middleware for Authentication details
module.exports.isValidUser = async (req, res, next) => {

    const {token} = req.params;
    const user = await Users.findOne({token});
    if(!user)
    {
        return res.status(400).send({'error': `Please enter valid user token ID ${token}`});
    }

    next();
} 

//Middleware for details Validation
module.exports.isValidData = async (req, res, next) => {

    const {ticker, shareprice, quantity} = req.body;
    if(shareprice <= 0)
    {
        return res.status(400).send({'error': 'Price should be positive(> 0)'});
    }
    else if(quantity <= 0)
    {
        return res.status(400).send({'error': 'Number of Shares BUY should be(> 0)'});
    }

    const bank = await Banks.findOne({ticker});
    if(!bank)
    {
        return res.status(400).send({'error': 'Security(Bank) does not exists'});
    }
    next();
}

//Middleware for details Validation
module.exports.isValidTid = async (req, res, next) => {

    const {token} = req.params;
    const {tid} = req.body;
    
    //Here we are populating the REF of Trade table
    const user = await Users.findOne({token}).populate({
        path: 'trades'
    });

    let isValidIndex = user.trades.findIndex(trade => trade.tid === tid);//Ceck whether that tid is valid or not.
    if(isValidIndex === -1)
    {
        return res.status(400).send({'error': 'Please enter valid Trade ID'});
    }
    
    next();
}