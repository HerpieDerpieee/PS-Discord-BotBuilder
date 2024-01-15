
  

# PS-Discord-BotBuilder
This is one of my personal projects, and I plan to update it for a while to come. This is a node.js webserver, which is hosting a website, with which you can "make" a discord bot.s
<br>

### Node.js and NPM Setup
When using this website, make sure you have [Node.js](https://nodejs.org/en) installed. When you are sure it's installed, clone the repository, and open a terminal in the folder. Then run the following command to install all required NPM packages
```bash
npm install archiver bcrypt body-parser express-session express fs-extra mysql path
``` 
<br>

### Database Setup

To get started with the project, you'll need to set up the database. Follow these steps: 
1. **Database Creation:**

	- Make sure you have a MySQL server installed on your machine. If not, you can download and install it from [MySQL Downloads](https://dev.mysql.com/downloads/).
	- Create a new database for your project.

2. **Importing Tables:**:
	- Import the db-config.sql file into your database using the following command:<br>
```mysql -u {your_username} -p {your_database_name} < /path/to/db-config.sql```
	- If you want to know more about the exact database structure, you can always take a look at the contents of `db-config.sql `
3. **Final Configuration:**
- Update the content in the config.json file. If you don't have it, feel free to make use of the config.json.example for the layout of the JSON file.
<br>

### Running the Application:
With the database set up and configured, you should be able to run your application. To run it, please use the following command
```bash
./startServer.sh
```
