const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Schema of USER
const UserSchema = new Schema ({
    username: {
            type: String,
            required: true
        },
    phoneno: {
        type: Number,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    token: {
        type: String,
        required: true,
        unique: true    
    },
    securities: {
        type: Map,
        of: [{ type: Number }],
        default: { "Ticker": [0] },  // <-- set default values
        required: true
      }
    ,
    trades: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Trade'
        }   
    ],
    tidcount: {
        type: Number,
        required: true,
        unique: true,
        default: 0
    }
})

module.exports = mongoose.model('User', UserSchema);
