const express = require('express');
var session = require('express-session');
var MySqlStore = require('express-mysql-session')(session);

const rootRouter = require('./router/rootRouter');
const authRouter = require('./router/authRouter');
const codeRouter = require('./router/codeRouter');
const personRouter = require('./router/personRouter');
const productRouter = require('./router/productRouter');
const boardtypeRouter = require('./router/boardtypeRouter');
const boardRouter = require('./router/boardRouter');
const purchaseRouter = require('./router/purchaseRouter');
const tableRouter = require('./router/tableRouter');     // ⭐ 13주차
const analRouter = require('./router/analRouter');       // ⭐ 13주차

var options = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'webdb2026'
};

var sessionStore = new MySqlStore(options);
const app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: sessionStore
}));

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use('/', rootRouter);
app.use('/auth', authRouter);
app.use('/code', codeRouter);
app.use('/person', personRouter);
app.use('/product', productRouter);
app.use('/boardtype', boardtypeRouter);
app.use('/board', boardRouter);
app.use('/purchase', purchaseRouter);
app.use('/table', tableRouter);         // ⭐ 13주차
app.use('/anal', analRouter);           // ⭐ 13주차

app.get('/favicon.ico', (req, res) => res.writeHead(404));

app.listen(3000, () => console.log('Example app listening on port 3000'));
