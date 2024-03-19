/* 
Importing all the required packages
*/
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const mysql = require('mysql');
const { exec } = require('child_process');

const {db} = require("./config.json")

/*
Creating some handy constants
*/
const documentRoot = `${__dirname}/httpdocs`
const webserverPort = 3002



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
app.use(express.static("src"))

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


app.post("/export", requireLogin, async (req, res) => {
    console.log('Export request received.');
    const projectId = req.query.id;
    const userId = req.session.userId;
    console.log(`Project ID: ${projectId}, User ID: ${userId}`);

    const con = createConnection();

    con.query("SELECT * FROM Projects WHERE project_id=? AND project_owner=?", [projectId, userId], async (err, projectResults) => {
        if (err) {
            console.error('Error checking project owner:', err);
            return res.status(500).send('Internal server error');
        }
        if (projectResults.length !== 1) {
            return res.status(404).send('Project not found or user is not the owner.');
        }

        const data = projectResults[0];
        const botToken = data.bot_token;

        con.query("SELECT command_id, command_name, command_description, command_response FROM Commands WHERE project_id = ?", [projectId], async (err, commands) => {
            if (err) {
                console.error('Error querying commands:', err);
                return res.status(500).send('Internal server error');
            }
            try {
                console.log("Started generating code");
                await generateGoCode(projectId, botToken, commands);
                
                console.log("Started compiling");
                await compileForWindows(projectId);

                // Assuming the compilation was successful, and .exe is ready.
                const directoryPath = path.join('bot_builds', projectId.toString());
                const exePath = path.join(directoryPath, 'discordBot.exe');
                
                console.log("Triggering download of the .exe file");
                res.download(exePath, 'discordBot.exe', (err) => {
                    if (err) {
                        console.error(`Error sending file: ${err}`);
                        return res.status(500).send('Failed to download the file.');
                    } else {
                        console.log('Download initiated successfully.');
                        cleanUp(projectId);
                    }
                });
            } catch (error) {
                console.error(error);
                res.status(500).send('An error occurred during the export process.');
            }
        });
    });
});

/*
Some functions for creating the bot
*/
function ensureDirectoryExists(directoryPath) {
    return new Promise((resolve, reject) => {
        console.log(`[ensureDirectoryExists] Ensuring directory exists: ${path.resolve(directoryPath)}`);
        fs.mkdir(directoryPath, { recursive: true }, (err) => {
            if (err) {
                reject(`Error creating directory: ${err}`);
            } else {
                resolve();
            }
        });
    });
}

function generateGoCode(projectId, botToken, commands) {
    return new Promise((resolve, reject) => {
        console.log(`[generateGoCode] Generating Go code for project ID: ${path.resolve(projectId)}`);
        const directoryPath = path.join('bot_builds', projectId.toString());
        const filePath = path.join(directoryPath, 'discordBot.go');

        ensureDirectoryExists(directoryPath).then(() => {
            let goCode = `
package main

import (
    "fmt"
    "github.com/bwmarrin/discordgo"
    "os"
    "os/signal"
    "syscall"
)

var (
    Token = "${botToken}"
)

func main() {
    dg, err := discordgo.New("Bot " + Token)
    if err != nil {
        fmt.Println("error creating Discord session,", err)
        return
    }

    dg.AddHandler(func(s *discordgo.Session, r *discordgo.Ready) {
        fmt.Println("Bot is up and running")
    })

    dg.AddHandler(func(s *discordgo.Session, i *discordgo.InteractionCreate) {
        if i.Type == discordgo.InteractionApplicationCommand {
            handleCommandInteraction(s, i)
        }
    })

    err = dg.Open()
    if err != nil {
        fmt.Println("error opening connection,", err)
        return
    }
    defer dg.Close()

    registerSlashCommands(dg)

    fmt.Println("Bot is now running. Press CTRL+C to exit.")
    sc := make(chan os.Signal, 1)
    signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt, os.Kill)
    <-sc
}

func registerSlashCommands(s *discordgo.Session) {
    ${commands.map(command => `s.ApplicationCommandCreate(s.State.User.ID, "", &discordgo.ApplicationCommand{
        Name: "${command.command_name}",
        Description: "${command.command_description}",
        Type: discordgo.ChatApplicationCommand,
    })`).join('\n\t')}
}

func handleCommandInteraction(s *discordgo.Session, i *discordgo.InteractionCreate) {
    ${commands.map(command => `
    if i.ApplicationCommandData().Name == "${command.command_name}" {
        s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
            Type: discordgo.InteractionResponseChannelMessageWithSource,
            Data: &discordgo.InteractionResponseData{
                Content: "${command.command_response}",
            },
        })
    }`).join('\n\t')}
}

            `;

            fs.writeFileSync(filePath, goCode);
            console.log('Go source code generated.');
            resolve();
        }).catch(err => {
            reject(err);
        });
    });
}

function compileForWindows(projectId) {
    return new Promise((resolve, reject) => {
        const directoryPath = path.resolve('bot_builds', projectId.toString());
        const exePath = path.resolve(directoryPath, 'discordBot.exe');

        console.log(`[compileForWindows] Directory path: ${directoryPath}`);

        if (!fs.existsSync(directoryPath)) {
            reject(`Directory ${directoryPath} does not exist`);
            return;
        }

        const goModPath = path.resolve(directoryPath, 'go.mod');
        if (!fs.existsSync(goModPath)) {
            const cmdInit = `go mod init discordBot && go get github.com/bwmarrin/discordgo`;
            console.log(`Running command: ${cmdInit} in directory: ${directoryPath}`);
            exec(cmdInit, { cwd: directoryPath }, (error, stdout, stderr) => {
                if (error) {
                    reject(`Error initializing Go module or getting discordgo package: ${error.message}`);
                    return;
                }
                compile();
            });
        } else {
            compile();
        }

        function compile() {
            const cmdCompile = `GOOS=windows GOARCH=amd64 go build -o "${exePath}"`;
            console.log(`Running command: ${cmdCompile} in directory: ${directoryPath}`);
            exec(cmdCompile, { cwd: directoryPath }, (error, stdout, stderr) => {
                if (error) {
                    reject(`Compilation error: ${error.message}`);
                    return;
                }
                console.log('Compilation for Windows completed.');
                resolve();
            });
        }
    });
}

function cleanUp(projectId) {
    return new Promise((resolve, reject) => {
        const directoryPath = path.join('bot_builds', projectId.toString());

        fs.rm(directoryPath, { recursive: true, force: true }, (err) => {
            if (err) {
                console.error(`Error removing directory: ${err}`);
                reject(err);
            } else {
                console.log(`${directoryPath} was deleted recursively.`);
                resolve();
            }
        });
    });
}

/* 
Starting up the server.
*/
app.listen(webserverPort, () => {
    console.log(`Bot Builder Online at http://localhost:${webserverPort}/`)
})
