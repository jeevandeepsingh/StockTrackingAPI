const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const BankSchema = new Schema ({
    bankname: {
            type: String,
            required: true
        },
    shareprice: {
        type: Number,
        required: true,
    },
    ticker: {
        type: String,
        required: true,
        unique: true
    }
})

module.exports = mongoose.model('Bank', BankSchema);