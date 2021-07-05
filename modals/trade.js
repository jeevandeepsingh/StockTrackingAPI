const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Schema of TRADE
const TradeSchema = new Schema ({
    token: {
        type: String,
        required: true,
    },
    tid: {
        type: String,
        required: true,
    },
    ticker: {
            type: String,
            required: true
        },
    shareprice: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: ['SELL', 'BUY'],
        required: true
    },
    quantity: {
        type: Number,
        required: true,
    },
    averagebuyprice: {
        type : Number,
        default: 0
    },
    prevquantity: {
        type: Number,
        default: 0
    },
    prevaveragebuyprice: {
        type : Number,
        default: 0
    }
})

module.exports = mongoose.model('Trade', TradeSchema);
