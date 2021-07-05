const Trade = require('../modals/trade');
const User = require('../modals/user');
const tradesUpdater = require('../utils/tradesUpdater');

/*
add function will add the trade into trade database as well as in user trades array.
Firstly tis function will verify that this operation is possible or not & then add it.
*/
module.exports.add = async (req, res) => {
    try {
        const {token} = req.params;
        const {ticker, shareprice, type, quantity} = req.body;
        
        const user = await User.findOne({token});//Find user using token ID
        const tid = user.tidcount+1; 

        if(type === "BUY")//If trade type = BUY
        {
            
            //If we already have some trades in our database of same security(bank).
            if(user.securities.has(ticker)) 
            {
                const data = user.securities.get(ticker);

                let prevaveragebuyprice = data[0], prevquantity = data[1];

                let averagebuyprice = (prevaveragebuyprice*prevquantity + quantity*shareprice)/(prevquantity+quantity);
                let noofshares = quantity+prevquantity;

                const trade = new Trade({token, tid, ticker, shareprice, type, quantity, averagebuyprice, prevaveragebuyprice, prevquantity});
                
                user.securities.set(ticker, [averagebuyprice, noofshares]);
                user.tidcount = tid;
                user.trades.push(trade);
                
                await trade.save();
                await user.save();
    
            }
            else //If BUYING this security(bank) trade first time.
            {
                let averagebuyprice = shareprice, noofshares = quantity;
                let prevaveragebuyprice = 0, prevquantity = 0;

                const trade = new Trade({token, tid, ticker, shareprice, type, quantity, averagebuyprice, prevaveragebuyprice, prevquantity});
                user.securities.set(ticker, [averagebuyprice, noofshares]);
                user.tidcount = tid;
                user.trades.push(trade);

                await trade.save();
                await user.save();

            }
        }
        else//If trade type = SELL
        {
            if(user.securities.has(ticker))//If we already have some trades in our database of same security(bank).
            {
                const data = user.securities.get(ticker);

                let averagebuyprice = data[0];
                let prevaveragebuyprice = data[0], prevquantity = data[1];

                if(quantity > prevquantity)//current available shares should be more than selling shares.
                {
                    return res.status(400).send({'error': 'Cannot sell shares more than current available shares'});
                }

                const trade = new Trade({token, tid, ticker, shareprice, type, quantity, averagebuyprice, prevaveragebuyprice, prevquantity});

                user.securities.set(ticker, [averagebuyprice, prevquantity-quantity]);
                
                user.tidcount = tid;
                user.trades.push(trade);
                
                await trade.save();
                await user.save();
    
            }
            else//If SELLING this security(bank) trade first time.
            {
                return res.status(400).send({'error': 'User does not have any shares of this company'});
            }
        }

        res.status(200).send({'success': 'Successfully added Trade'});    
    }catch(e) {
        res.status(400).send({'error': 'Invalid request error'});
    }
}

//Details function simply returns the details of user 
module.exports.details = async (req, res) => {
    
    try {
        const {token} = req.params;

        //Here we are populating the REF of Trade table
        const user = await User.findOne({token}).populate({
            path: 'trades'
        });

        let tradedetails = new Map();   

        for(let i = 0 ; i < user.trades.length ; i++)
        {
            if(tradedetails.has(user.trades[i].ticker))
            {
                tradedetails.set(user.trades[i].ticker,[...tradedetails.get(user.trades[i].ticker),{
                    tid: user.trades[i].tid,
                    shareprice: user.trades[i].shareprice, 
                    type: user.trades[i].type,
                    quantity: user.trades[i].quantity
                }]);
            }
            else
            {
                tradedetails.set(user.trades[i].ticker,[{
                    tid: user.trades[i].tid,
                    shareprice: user.trades[i].shareprice, 
                    type: user.trades[i].type,
                    quantity: user.trades[i].quantity
                }]);
            }
        }

        //Since map is not JSON Supported we are taking help of JSON.stringify to make it compatible with JSON.
        res.send(JSON.stringify([...tradedetails]));  
    
    }catch(e) {
    res.status(400).send({'error': 'Invalid request error'});
    }
}

/*
update function will update the trade into trade database as well as in user trades array.
Firstly tis function will verify that this operation is possible or not & then update it.
*/
module.exports.update = async (req, res) => {
    try {

        const {token} = req.params;
        const {tid, ticker, shareprice, type, quantity} = req.body;
        
        //Here we are populating the REF of Trade table
        const user = await User.findOne({token}).populate({
            path: 'trades'
        });

        let tradeIndex = user.trades.findIndex(trade => trade.tid === tid);
        let oldticker = user.trades[tradeIndex].ticker;

        const trades = await Trade.find({token: token, ticker: oldticker});
        let idx = trades.findIndex(trade => trade.tid === tid);//Find index of the trade which we have to delete
        
        //updating the old trade details
        trades[idx].shareprice = shareprice;
        trades[idx].type = type;
        trades[idx].quantity = quantity;
        trades[idx].ticker = ticker;
        trades[idx].averagebuyprice = 0;
        trades[idx].prevquantity = 0;    
        trades[idx].prevaveragebuyprice = 0;

         //If we are updating a trade values but the security(bank) is same
        if(ticker === oldticker)
        {
            await tradesUpdater.updateTrades(req, res, trades, ticker, user);//Bcz we have to update trade for same company.
            return res.status(200).send({'success': 'Successfully updated a Trade'});        
        }
        else//If we are updating a trade values of different security(bank).
        {
            //Firstly we check after updating the old trade will not effect the other trades of old security(bank).
            const response = await tradesUpdater.updateTrades(req, res, trades, oldticker, user);                
            
            if(response.statusCode != 400)//Updation is possible then
            {
                const tradeB = await Trade.find({token: token, ticker: ticker});
                
                //we check updating the this trade will not effect the other trades of new security(bank) & then Update the trade in for new security(bank).
                await tradesUpdater.updateTrades(req, res, tradeB, ticker, user);
            
                return res.status(200).send({'success': 'Successfully updated a Trade'});        
            }
        } 

    }catch(e) {
        return res.status(400).send({'error': 'Invalid request error'});
    }
}   

/*
delete function will delete the trade into trade database as well as in user trades array.
Firstly tis function will verify that this operation is possible or not & then delete it.
*/
module.exports.delete = async (req, res) => {
    try {
        const {token} = req.params;
        const {tid} = req.body;
        
        //Here we are populating the REF of Trade table
        const user = await User.findOne({token}).populate({
            path: 'trades'
        });

        let tradeIndex = user.trades.findIndex(trade => trade.tid === tid);//Find index of the trade which we have to delete
        let ID = user.trades[tradeIndex]._id;
        let ticker = user.trades[tradeIndex].ticker;

        const trades = await Trade.find({token: token, ticker: ticker});//extract all the trades from TRADE collection of same bank for particular user. 

        //updating the old trade details
        trades[tradeIndex].shareprice = 0;
        trades[tradeIndex].quantity = 0;
        trades[tradeIndex].averagebuyprice = 0;
        trades[tradeIndex].prevquantity = 0;    
        trades[tradeIndex].prevaveragebuyprice = 0;

        //Firstly we check after delete the trade will not effect the other trades of security(bank).
        const response = await tradesUpdater.updateTrades(req, res, trades, ticker, user);//Bcz we have to update trade for same company.
        
        if(response.statusCode != 400)//deleteion is possible then
        {
            await Trade.findByIdAndDelete(ID);
            user.trades.splice(tradeIndex,1);
            await user.save(); 

            return res.status(200).send({'success': 'Successfully Delete Trade'});    
        }
    }catch(e) {
        return res.status(400).send({'errorsads': e.message});
    }
}   
