const User = require('../modals/user');
const Bank = require('../modals/bank');
const Trades = require('../modals/trade');

/*
register function is creating a new user in USER database
& generating the unique TOKEN ID for unique identification of user.
*/
module.exports.register = async (req, res) => {
    try {
        const {username, email, phoneno} = req.body;
        const token = Math.floor(Math.random() * 13234563);
        const user = new User({username, email, phoneno, token});
        
        await user.save();
        
        return res.status(200).send({'success': 'Successfully added USER', 'token': token});    
    }catch(e) {
        return res.status(400).send({'error': 'Invalid Request'});
    }
}

/*
portfolio function will return the portfolio of a user.
So for portfolio we take help of securities MAP which store
the details of the securities & their updated AverageBuyPrice. 
*/
module.exports.portfolio = async (req, res) => {
    try {
        const {token} = req.params;
        const user = await User.findOne({token});

        const {username, phoneno, email, securities} = user;
        let securitiestable = [];
        for (let [key, value] of securities) {
            
            if(key === 'Ticker' || value[1] === 0)    continue;//To eleminate default value

            securitiestable.push({
                Tickersymbol: key,
                AverageBuyPrice: value[0],
                Shares: value[1]
            })
        }

        res.status(200).send({username, phoneno, email, securitiestable});    
    }catch(e) {
        res.status(400).send({'error': 'Invalid Request'});
    }
}

/*
returns function will return the cumulativeShareReturn for a particular USER
*/
module.exports.returns = async (req, res) => {
    try {

        const {token} = req.params;
        const user = await User.findOne({token});

        const {username, phoneno, email, securities} = user;
        
        let cumulativeShareReturn = 0;
        //key = Ticker Symbol & value -> Share quantity
        for (let [key, value] of securities) {
            
            if(key === 'Ticker')    continue;//To eleminate default value

            let bank = await Bank.findOne({ticker: key});
            cumulativeShareReturn += (bank.shareprice - value[0])*value[1];
        }

        res.status(200).send({username, phoneno, email, cumulativeShareReturn});    
    }catch(e) {
        res.status(400).send({'error': 'Invalid Request'});
    }
}

//resetData will Delete all the data of users like trades,companies & users also from database.
module.exports.resetData = async (req, res) => {
    try {

        await User.deleteMany({});
        await Trades.deleteMany({});
        await Bank.deleteMany({});

        res.status(200).send({'message': 'Reset successful'});    
    }catch(e) {
        res.status(400).send({'error': 'Invalid Request'});
    }
}
