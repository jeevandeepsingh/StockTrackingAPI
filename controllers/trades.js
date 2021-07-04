const Trade = require('../modals/trade');
const User = require('../modals/user');
const tradesUpdater = require('../utils/tradesUpdater');

module.exports.add = async (req, res) => {
    try {
        const {token} = req.params;
        const {ticker, shareprice, type, quantity} = req.body;
        
        const user = await User.findOne({token});
        const tid = user.tidcount+1; 

        if(type === "BUY")
        {
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
            else
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
        else
        {
            if(user.securities.has(ticker))
            {
                const data = user.securities.get(ticker);

                let averagebuyprice = data[0];
                let prevaveragebuyprice = data[0], prevquantity = data[1];

                if(quantity > prevquantity)
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
            else
            {
                return res.status(400).send({'error': 'User does not have any shares of this company'});
            }
        }

        res.status(200).send({'success': 'Successfully added Trade'});    
    }catch(e) {
        res.status(400).send({'error': e.message});
    }
}

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
    res.status(400).send({'error': e.message});
    }
}


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
        let idx = trades.findIndex(trade => trade.tid === tid);
        
        trades[idx].shareprice = shareprice;
        trades[idx].type = type;
        trades[idx].quantity = quantity;
        trades[idx].ticker = ticker;
        trades[idx].averagebuyprice = 0;
        trades[idx].prevquantity = 0;    
        trades[idx].prevaveragebuyprice = 0;

        if(ticker === oldticker)
        {
            await tradesUpdater.updateTrades(req, res, trades, ticker, user);//Bcz we have to update trade for same company.
        }
        else
        {
            await tradesUpdater.updateTrades(req, res, trades, oldticker, user);//Bcz we have to update trade for Diff company we don't consider cur trade.                
            
            const tradeB = await Trade.find({token: token, ticker: ticker});
            await tradesUpdater.updateTrades(req, res, tradeB, ticker, user);//Bcz we have to update trade for Diff company we don't consider cur trade.
        } 

        return res.status(200).send({'success': 'Successfully added Trade'});    
    }catch(e) {
        return res.status(400).send({'error': 'Invalid request error'});
    }
}   

module.exports.delete = async (req, res) => {
    try {

        const {token} = req.params;
        const {tid} = req.body;
        
        //Here we are populating the REF of Trade table
        const user = await User.findOne({token}).populate({
            path: 'trades'
        });

        let tradeIndex = user.trades.findIndex(trade => trade.tid === tid);
        let ID = user.trades[tradeIndex]._id;
        let ticker = user.trades[tradeIndex].ticker;
        await Trade.findByIdAndDelete(ID);

        user.trades.splice(tradeIndex,1);
        await user.save();

        const trades = await Trade.find({token: token, ticker: ticker});
        await tradesUpdater.updateTrades(req, res, trades, ticker, user);//Bcz we have to update trade for same company.
        
        return res.status(200).send({'success': 'Successfully Delete Trade'});    
    }catch(e) {
        return res.status(400).send({'error': e.message});
    }
}   
