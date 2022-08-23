const express = require('express')
const app = express()
const multer = require('multer');
const mysql = require('mysql2');
const urlencodedParser = express.urlencoded();
const { engine } = require ('express-handlebars');
const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    database: 'node24',
    password: ''
});
app.engine('handlebars', engine());
app.set('views', './views');
app.set('view engine', 'handlebars');

app.use(express.static(`${__dirname}/public`));

app.get('/', (req,res)=>{
    res.statusCode = 200;
    res.render('home', {title: "Главная страница", content: "Hello world"})
})
app.get('/reg', (req, res)=>{
   res.render('reg', {title: "Регистрация"});
});
app.post('/reg', multer().fields([]), (req, res)=>{
    console.log(req.body);
    const login = req.body.email;
    const pass = req.body.pass;
    const name = req.body.name;
    const lastname = req.body.lastname;
    connection.execute(
        "INSERT INTO `users`(`login`, `pass`, `name`, `lastname`) VALUES (?,?,?,?)",
        [login, pass, name, lastname]);
    res.json({result: "success"});
})
app.get('/auth', multer().fields([]), (req, res)=>{
    // Выполнить запрос поиска по логину и паролю пользователя
    // Выведите в консоль найденного пользователя
    res.render('auth', {title: "Авторизация"});
})
app.get('/about', (req,  res)=>{
    res.statusCode = 200;
    res.send('About page');
});
app.post('/handlerFeedBack',  urlencodedParser, (req, res)=>{
    console.log(req.body);
    res.send(req.body);
})
app.get('*', (req, res)=>{
    res.statusCode = 404;
    res.send('Not found');
})
app.listen(3000);