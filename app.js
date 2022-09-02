// решить проблему с регистром логина
const express = require('express')
const app = express()
const multer = require('multer');
const mysql = require('mysql2');
const HTMLParser = require('node-html-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const cookieParser = require('cookie-parser');
const urlencodedParser = express.urlencoded();
const fs = require('fs');
const { engine } = require ('express-handlebars');
const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    database: 'node24',
    password: ''
});
function getIntRandom(min, max){
    Math.floor(Math.random()*(max-min)+min)
}
app.engine('handlebars', engine());
app.set('views', './views');
app.set('view engine', 'handlebars');
app.use(cookieParser('secret'))

app.use(express.static(`${__dirname}/public`));

app.get('/', (req,res)=>{
    res.statusCode = 200;
    res.render('home',
        {title: "Главная страница",
            content: "Hello world",
            auth: req.cookies.token});
})
app.get('/reg', (req, res)=>{
   res.render('reg', {title: "Регистрация"});
});
app.post('/reg', multer().fields([]), (req, res)=>{
    console.log(req.body);
    const login = req.body.email.toLowerCase();
    const pass = req.body.pass;
    const name = req.body.name;
    const lastname = req.body.lastname;
    connection.execute("SELECT id FROM users WHERE login=?", [login], (err, resultSet)=>{
        if(resultSet.length)
            res.json({result: "user_exist"});
        else{
            connection.execute(
                "INSERT INTO `users`(`login`, `pass`, `name`, `lastname`) VALUES (?,?,?,?)",
                [login, pass, name, lastname]);
            res.json({result: "success"});
        }
    })
})
app.get('/auth', (req, res)=>{
    res.render('auth', {title: "Авторизация"});
})
app.post("/auth", multer().fields([]), (req, res)=>{
    const login = req.body.login;
    const pass = req.body.pass;
    connection.execute("SELECT * FROM users WHERE login=? AND pass=?",
        [login, pass], (err, resultSet)=>{
        console.log(resultSet)
        if(resultSet.length){
            const user = resultSet[0];
            const token = bcrypt.hashSync((Date.now()+getIntRandom(10,100)).toString(), saltRounds);
            console.log(token, user.id)
            connection.execute("UPDATE users SET token = ? WHERE id = ? ",
                [token, user.id]);
            res.cookie("token", token);
            res.json({result: "success"})
        }else{
            res.json({result: "error"})
        }
    });
})
app.get('/addArticle', (req, res)=>{
    res.render('addArticle', {title: "Добавить статью"});
});
app.post('/addArticle', multer().any(), (req, res)=>{
    const title = req.body.title;
    const content = req.body.content;
    const author = req.body.author;
    const document = HTMLParser.parse(content);
    const img = document.querySelector("img");
    if(img){
        let src = img.getAttribute('src');
        let base64 = src.split(',')[1];
        let extension = src.split(',')[0].split('/')[1].split(';')[0];
        let filename = Date.now()+"."+extension;
        fs.writeFile('public/userFiles/'+filename, base64, 'base64', (err)=>{
            console.log(err);
        });
        img.setAttribute("src", "/userFiles/"+filename);
    }
    connection.execute("INSERT INTO `articles` (title, content, author) VALUES (?,?,?)",
        [title, document.toString(), author]);
    res.json({result: "success"});
});
app.get("/getArticles", (req, res)=>{
   connection.execute("SELECT * FROM articles", (err, resultSet)=>{
       res.json(resultSet);
   })
});
app.get('/blog/:articleId', (req,res)=>{
    const articleId = req.params.articleId;
    connection.execute("SELECT * FROM articles WHERE id=?",
        [articleId],
        (err, resultSet)=>{
        const article = resultSet[0];
        res.render('article',
            {title: article.title, content: article.content, author: article.author});
    })
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