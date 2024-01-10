/* 
Importing all the required packages
*/
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

const {db} = require("./config.json")

/*
Creating some handy constants
*/
const documentRoot = `${__dirname}/httpdocs`
const webserverPort = 3000



/**
 * Creates a MySQL connection.
 * @returns {Object} MySQL connection object
 */
const createConnection = () => {
    return mysql.createConnection({
        host: db.location,
        user: db.username,
        password: db.password,
        database: db.db_name,
        connectTimeout: 20000,
    });
};


/** 
 * Setting up the express webserver
 * 
 */
const app = express()

app.use(express.static("styles"))
app.use(express.static("scripts"))

app.use(session({secret: 'secret',resave: true,saveUninitialized: true}));

app.use( bodyParser.json() );
app.use(express.json());

app.use(bodyParser.urlencoded({extended: true})); 
app.use(express.urlencoded({extended: true}));



/* 
Setting up the login system
*/
const requireLogin = (req, res, next) => {
    if (!req.session.userId) {
        res.redirect('/');
    } else {
        next();
    }
};


/* 
Setting up all the website pages
*/
app.get("/", (req, res) => {
    res.sendFile(`${documentRoot}/login.html`);
})


app.get("/dashboard",requireLogin, (req, res) => {
    res.sendFile(`${documentRoot}/dashboard.html`);
});

app.get("/projects/:projectId/", requireLogin, (req, res)=>{
    const con = createConnection();

    const sql = "SELECT MAX(project_id) as maxProjectID FROM Projects";
    con.query(sql, (err, results) => {
        if (err) throw err;
        con.end();
        const maxProjectID = results[0].maxProjectID;

        if (parseInt(maxProjectID) < parseInt(req.params.projectId)) return res.redirect("/dashboard");
        else {
            res.sendFile(`${documentRoot}/project.html`);
        }
    });
})


/* 
Setting up all the website posting pages.
*/

app.post("/", (req, res) => {
    /**
     * Login Validation
     */
    const { username, password } = req.body;
    
    const con = createConnection();

    const sql = "SELECT * FROM Users WHERE username = ?";
    con.query(sql, [username], (err, results) => {
        if (err) {
            console.error('Error executing login query:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        con.end();

        if (results.length > 0) {
            bcrypt.compare(password, results[0].password, (bcryptErr, isMatch) => {
                if (bcryptErr) {
                    console.error('Error comparing passwords:', bcryptErr);
                    res.status(500).send('Internal Server Error');
                    return;
                }
                if (isMatch) {
                    req.session.userId = results[0].user_id;
                    res.redirect('/dashboard');
                } else {
                    res.send('Invalid username or password');
                }
            });
        } else {
            res.send('Invalid username or password');
        }
    });
});


/* 
Commands Grid
*/
app.get("/fetch-commands", requireLogin, (req, res)=> {
    const projectId = req.query.id;
    const userId = req.session.userId;

    const con = createConnection();

    const ownerCheck = "SELECT project_id FROM Projects WHERE project_id=? AND project_owner=?"
    con.query(ownerCheck, [projectId, userId], (err, results)=>{
        if (err) throw err;
        if (results.length != 1)return res.json({});



        const sql = "SELECT command_id, command_name, command_description, command_response FROM Commands WHERE project_id = ?";
        con.query(sql, [projectId], (err, results) => {
            if (err) throw err;
            con.end();
            let result = [];
    
            for (let i = 0; i < results.length; i++){
                result.push({"name": results[i]["command_name"], "description": results[i]["command_description"], "id": results[i]["command_id"], "response": results[i]["command_response"]});
            }
            
            res.json(result);
        });

    })


});

app.get("/fetch-project-data", requireLogin, (req, res)=>{
    const projectId = req.query.id;
    const userId = req.session.userId;

    let response = {};

    const con = createConnection();

    const sql = "SELECT * FROM Projects WHERE project_id=? AND project_owner=?";
    con.query(sql, [projectId, userId], (err, results)=>{
        if (err) throw err;
        if (results.length != 1) return res.json(response);
        con.end();

        response["projectName"] = results[0]["project_name"];
        response["projectId"] = projectId;

        res.json(response)
    })
});

app.post("/delete-command", requireLogin, (req, res)=> {
    const projectId = req.query.projectId;
    const commandId = req.query.commandId;
    const userId = req.session.userId;

    const con = createConnection();

    const ownerCheck = "SELECT project_id FROM Projects WHERE project_id=? AND project_owner=?"
    con.query(ownerCheck, [projectId, userId], (err, results)=>{
        if (err) throw err;
        if (results.length != 1)return res.json({});

        const sql = "DELETE FROM Commands WHERE command_id=?";
        con.query(sql, [commandId], (err, results)=>{
            if (err) throw err;
            con.end();
 
            res.status(200).send("true");
        })
    })


})

app.post("/create-command", requireLogin, (req, res)=> {
    let name = req.body.name;
    let description = req.body.description;
    let response = req.body.response;

    name = name.replace(" ", "-");

    let projectId = req.body.projectId;
    let owner = req.session.userId;

    const con = createConnection();

    const ownerCheck = "SELECT project_id FROM Projects WHERE project_id=? AND project_owner=?"
    con.query(ownerCheck, [projectId, owner], (err, results)=>{
        if (err) throw err;
        if (results.length != 1)return;

        const sql = "INSERT INTO Commands (project_id, command_name, command_description, command_response) VALUES (?,?,?,?)";
        con.query(sql, [projectId, name, description, response], (err, results)=>{
            if (err) throw err;
            con.end();
            res.status(200).send("true");
        })
    })
})




/* 
Projects Grid
*/
app.get("/fetch-bots", requireLogin, (req, res)=> {
    const sql = "SELECT project_name, project_id FROM Projects WHERE project_owner = ?";

    const con = createConnection();

    con.query(sql, [req.session.userId], (err, results) => {
        if (err) throw err;
        con.end();

        let result = [];

        for (let i = 0; i < results.length; i++){
            result.push({"name": results[i]["project_name"], "id": results[i]["project_id"]});
        }
        
        res.json(result);
    });
});

app.post("/create-bot", requireLogin, (req, res)=> {
    let name = req.body.name;
    let token = req.body.token;
    let clientId = req.body.clientId;
    let owner = req.session.userId;

    if (name.length > 20)return;

    let bot = {"name": name}

    const con = createConnection();

    var sql = "INSERT INTO Projects (project_name, project_owner, bot_token, bot_id) VALUES (?, ?, ?, ?)";
    con.query(sql, [name, owner, token, clientId], function (err, result) {
        if (err) throw err;
        con.end();
    });

    res.send('true');
})

app.post("/rename-project", requireLogin, (req,res)=>{
    let name = req.body.name;
    let projectId = req.body.id;
    let userId = req.session.userId;

    const con = createConnection();

    const ownerCheck = "SELECT project_id FROM Projects WHERE project_id=? AND project_owner=?"
    con.query(ownerCheck, [projectId, userId], (err, results)=>{
        if (err) throw err;
        if (results.length != 1)return;

        const sql = "UPDATE Projects SET project_name=? WHERE project_id=?";
        con.query(sql, [name, projectId], (err, results)=>{
            if (err) throw err;
            con.end();
            res.status(200).send("true");
        })
    })
})


app.post("/export", requireLogin, (req, res) => {
    const projectId = req.query.id;
    const userId = req.session.userId;

    const con = createConnection();

    const ownerCheck = "SELECT * FROM Projects WHERE project_id=? AND project_owner=?";
    con.query(ownerCheck, [projectId, userId], (err, results) => {
        if (err) throw err;
        if (results.length !== 1) return res.json({});

        const data = results[0];
        const botToken = data.bot_token;
        const clientId = data.bot_id;

        con.query("SELECT command_id, command_name, command_description, command_response FROM Commands WHERE project_id = ?", [projectId], (err, result) => {
            if (err) throw err;
            con.end();

            const commands = result.map(command => {
                return {
                    name: command.command_name,
                    description: command.command_description,
                    response: command.command_response
                };
            });

            const jsonContent = {
                token: botToken,
                clientId: clientId,
                commands: commands
            };

            const botBuildsPath = `./bot_builds/${projectId}`;

            // Create the directory if it doesn't exist
            fs.ensureDirSync(botBuildsPath);

            // Copy everything from "./example_bot" to "./botBuilds/{id}/"
            const exampleBotPath = "./example_bot";
            fs.copySync(exampleBotPath, botBuildsPath);

            // Write JSON to a file in the new directory
            const configFile = path.join(botBuildsPath, "config.json");
            fs.writeFileSync(configFile, JSON.stringify(jsonContent, null, 2));

            // Create a zip file
            const outputZipPath = path.join(__dirname, `./bot_builds/${projectId}.zip`);
            const outputZipStream = fs.createWriteStream(outputZipPath);
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });

            outputZipStream.on('close', () => {
                res.download(outputZipPath, (err) => {
                    if (err) throw err;
                    fs.removeSync(outputZipPath);
                    fs.removeSync(botBuildsPath);
                });
            });

            archive.on('error', (err) => {
                throw err;
            });

            archive.pipe(outputZipStream);
            archive.directory(botBuildsPath, false);
            archive.finalize();
        });
    });
});


/* 
Starting up the server.
*/
app.listen(webserverPort, () => {
  console.log(`Bot Builder Online at http://localhost:${webserverPort}/`)
})
