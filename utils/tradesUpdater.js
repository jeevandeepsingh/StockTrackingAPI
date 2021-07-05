const Trade = require('../modals/trade');
const User = require('../modals/user');

module.exports.updateTrades = async (req, res, trades, ticker, user) => {
    try {
        let idx = 0;
        let prevaveragebuyprice = 0;
        let prevquantity = 0;

        //Have more Trades and we have to check them
        for( ; idx < trades.length ; idx++)
        {

            if(trades[idx].ticker != ticker)    
            {
                if(idx === 0)
                {
                    prevaveragebuyprice = 0;
                    prevquantity = 0;
                } 
                continue; 
            }

            if(trades[idx].type === 'BUY')
            {

                let curaveragebuyprice = trades[idx].shareprice, curquantity = trades[idx].quantity;

                let averagebuyprice = (prevaveragebuyprice*prevquantity + curquantity*curaveragebuyprice)/(prevquantity+curquantity);
                let noofshares = curquantity+prevquantity;
                
                trades[idx].averagebuyprice = averagebuyprice;
                trades[idx].prevquantity = prevquantity;    
                trades[idx].prevaveragebuyprice = prevaveragebuyprice;
                
                prevaveragebuyprice = averagebuyprice;
                prevquantity = noofshares;
            }
            else
            {
                if(prevquantity > 0)
                {

                    let curquantity = trades[idx].quantity;

                    if(curquantity > prevquantity)
                    {
                        return res.status(400).send({'error': 'Invalid request error'});//Cannot sell shares more than current available shares
                    }
                    
                    
                    trades[idx].averagebuyprice = prevaveragebuyprice;
                    trades[idx].prevquantity = prevquantity;
                    trades[idx].prevaveragebuyprice = prevaveragebuyprice;
                    
                    prevquantity = prevquantity-curquantity;
                }
                else
                {
                    return res.status(400).send({'error': 'Invalid request error'});//User does not have any shares of this company
                }   
            }
        }

        for(idx = 0 ; idx < trades.length ; idx++)
        {
            await trades[idx].save();
        }


        user.securities.set(ticker, [prevaveragebuyprice, prevquantity]);

        await user.save();
        return 200;//Status Code
    }catch(e) {
        return res.status(400).send({'error': 'Invalid request error'});
    }
}
