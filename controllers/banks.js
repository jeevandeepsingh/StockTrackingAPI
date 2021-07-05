const Bank = require('../modals/bank');
const mongoose = require('mongoose');

/*
This function will add bank in our database &
also set the current sharepriceof that bank. 
*/
module.exports.add = async (req, res) => {
    try {
        const {bankname, ticker, shareprice} = req.body;
        const bank = new Bank({bankname, ticker, shareprice});
        
        await bank.save();
        
        res.status(200).send({'success': 'Successfully added BANK'});    
    }catch(e) {
        res.status(200).send({'error': e.message});
    }
}
