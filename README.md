# PS-Discord-BotBuilder
This is one of my personal projects, and I plan to update it for a while to come. This is a node.js webserver, which is hosting a website, with which you can "make" a discord bot.



### Database Setup

To get started with the project, you'll need to set up the database. Follow these steps:

1. **Database Installation:**
    - Make sure you have a MySQL server installed on your machine. If not, you can download and install it from [MySQL Downloads](https://dev.mysql.com/downloads/).
    - Create a new database for your project.

2. **Database Schema:**

    ###### Table 1: `Commands`

    - **Columns:**
        - `command_id` (INT, Auto Increment, Primary Key)
        - `project_id` (INT)
        - `command_name` (VARCHAR)
        - `command_description` (VARCHAR)
        - `command_response` (VARCHAR)

    - **Create Table Command:**
        ```sql
        CREATE TABLE Commands (
            command_id INT AUTO_INCREMENT PRIMARY KEY,
            project_id INT,
            command_name VARCHAR(255) NOT NULL,
            command_description VARCHAR(255),
            command_response VARCHAR(255)
        );
        ```

    ###### Table 2: `Projects`

    - **Columns:**
        - `project_id` (INT, Auto Increment, Primary Key)
        - `project_name` (VARCHAR)
        - `project_owner` (VARCHAR)
        - `bot_token` (VARCHAR)
        - `bot_id` (VARCHAR)

    - **Create Table Command:**
        ```sql
        CREATE TABLE Projects (
            project_id INT AUTO_INCREMENT PRIMARY KEY,
            project_name VARCHAR(255) NOT NULL,
            project_owner VARCHAR(36),
            bot_token VARCHAR(255) NOT NULL,
            bot_id VARCHAR(255) NOT NULL
        );
        ```

    ###### Table 3: `Users`

    - **Columns:**
        - `user_id` (VARCHAR, Default: UUID(), Primary Key)
        - `username` (VARCHAR)
        - `password` (VARCHAR)

    - **Create Table Command:**
        ```sql
        CREATE TABLE Users (
            user_id VARCHAR(36) DEFAULT UUID() PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL
        );
        ```

3. **Database Configuration:**
    - Update the content in the config.json file, if you dont have it, feel free to make use of the config.json.example for the layout of the json file.

4. **Running the Application:**
    - With the database set up and configured, you should be able to run your application. To run it, please use the following command
   ```bash
        	./startServer.sh
    ```

Note: For security reasons, avoid storing sensitive information like database credentials directly in your public GitHub repository. Consider using environment variables or a configuration file outside the repository for such sensitive data.

