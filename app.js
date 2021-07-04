const express = require('express');
const app = express();

const ExpressError = require('./utils/ExpressError');

// const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/portfoliotrackerApp';
// 'mongodb+srv://our-first-user:AFsMHkIuWN55jLbH@cluster0.vh5se.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://our-first-user:AFsMHkIuWN55jLbH@cluster0.vh5se.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const userRoutes = require('./routes/users');
const bankRoutes = require('./routes/banks');
const tradesRoutes = require('./routes/trades');
const bodyParser = require('body-parser');

app.use(bodyParser.json());// json parser
app.use(express.urlencoded({extended: true}));//x-www-form-urlencoded parser

app.use('/trade',tradesRoutes);
app.use('/bank',bankRoutes);
app.use('/',userRoutes);

//Handling all error
app.all('*', (req, res, next) => {
    next (new ExpressError('URL Not Found', 404));
})

//Error Handler Middleware
app.use((err, req, res, next) => {
    const {statusCode = 500} = err;
    if(!err.message) err.message =  'Oh No, Something Went Wrong!';
    res.status(statusCode).send({'error':err});
})

const port = process.env.PORT || 3000;
app.listen(port,() => {
    console.log(`LISTENING ON PORT {port}`);
})