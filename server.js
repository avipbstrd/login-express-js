const express = require('express');
const exphbs = require('express-handlebars');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const app = express();

// To support URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// To parse cookies from the HTTP Request
app.use(cookieParser());

app.engine('hbs', exphbs.engine({
    extname: '.hbs'
}));

app.set('view engine', 'hbs');

// Our requests hadlers will be implemented here...

app.get('/', function (req, res) {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

const crypto = require('crypto');

const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
};

const users = [
    // This user is added to the array to avoid creating a new user on each restart
    {
        firstName: 'avip',
        lastName: 'bstrd',
        email: 'bstrd@gmail.com',
        // This is the SHA256 hash for value of `password`
        password: 'XohImNooBHFR0OVvjcYpJ3NgPQ1qq73WKhHvch0VQtg='
    }
];

app.post('/register', (req, res) => {
    const { email, firstName, lastName, password, confirmPassword } = req.body;

    // Check if the password and confirm password fields match
    if (password === confirmPassword) {

        // Check if user with the same email is also registered
        if (users.find(user => user.email === email)) {

            res.render('register', {
                message: 'User Sudah Terdaftar.',
                messageClass: 'alert-danger'
            });

            return;
        }

        const hashedPassword = getHashedPassword(password);

        // Store user into the database if you are using one
        users.push({
            firstName,
            lastName,
            email,
            password: hashedPassword
        });

        res.render('login', {
            message: 'Registrasi Selesai,Silahkan Login untuk Melanjutkan.',
            messageClass: 'alert-success'
        });
    } else {
        res.render('register', {
            message: 'Password does not match.',
            messageClass: 'alert-danger'
        });
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

const generateAuthToken = () => {
    return crypto.randomBytes(30).toString('hex');
};

// This will hold the users and authToken related to users
const authTokens = {};

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = getHashedPassword(password);

    const user = users.find(u => {
        return u.email === email && hashedPassword === u.password
    });

    if (user) {
        const authToken = generateAuthToken();

        // Store authentication token
        authTokens[authToken] = user;

        // Setting the auth token in cookies
        res.cookie('AuthToken', authToken);

        // Redirect user to the protected page
        res.redirect('/protected');
    } else {
        res.render('login', {
            message: 'Nama atau Password Salah',
            messageClass: 'alert-danger'
        });
    }
});

app.use((req, res, next) => {
    // Get auth token from the cookies
    const authToken = req.cookies['AuthToken'];

    // Inject the user to the request
    req.user = authTokens[authToken];

    next();
});

app.get('/protected', (req, res) => {
    if (req.user) {
        res.render('protected');
    } else {
        res.render('login', {
            message: 'Silahkan login untuk melanjutkan',
            messageClass: 'alert-danger'
        });
    }
});

app.get('/logout',function(req,res){
    cookie = req.cookies;
        for (var prop in cookie) {
            if (!cookie.hasOwnProperty(prop)) {
                continue;
            }
            res.cookie(prop,'', {expires: new Date(0)});
            console.log("user logged out.")
        }
    res.redirect('/login');
});

app.listen(3000);
