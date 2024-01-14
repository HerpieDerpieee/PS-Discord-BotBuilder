const { REST, Routes } = require('discord.js');
const { clientId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const generateCommandFile = (command) => {
    return `const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('${command.name}')
        .setDescription('${command.description}'),
    async execute(interaction) {
        await interaction.reply('${command.response}');
    },
};
`;
};



const updateCommands = () => {
    const commands = [];
    const foldersPath = path.join(__dirname, 'commands');
    const utilityFolderPath = path.join(foldersPath, 'utility');

    // Delete all files from ./commands/utility/ before creating new ones
    fs.readdirSync(utilityFolderPath).forEach((file) => {
        const filePath = path.join(utilityFolderPath, file);
        fs.unlinkSync(filePath);
        console.log(`Deleted ${file}`);
    });


	// CREAYE ALL THE COMMAND FILES HERE (OVERWRITE THEM IF THEY ALREADY EXSIST)
    const { commands: jsonCommands } = require('./config.json');
    for (const command of jsonCommands) {
        const commandFileName = `${command.name}.js`;
        const commandFilePath = path.join(foldersPath, `utility/${commandFileName}`);

        if (!fs.existsSync(commandFilePath)) {
            // If the command file doesn't exist, create it
            fs.writeFileSync(commandFilePath, generateCommandFile(command));
            console.log(`Created ${commandFileName}`);
        }
    }
	
	for (const folder of fs.readdirSync(foldersPath)) {
		const commandsPath = path.join(foldersPath, folder);
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command = require(filePath);
			if ('data' in command && 'execute' in command) {
				commands.push(command.data.toJSON());
			} else {
				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		}
	}
	
	const rest = new REST().setToken(token);
	
	(async () => {
		try {
			console.log(`⚙️ Started refreshing ${commands.length} application (/) commands.`);
	
			const data = await rest.put(
				Routes.applicationCommands(clientId),
				{ body: commands },
			);
	
			console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
		} catch (error) {
			console.error(`❌ ${error}`);
		}
	})();
}

module.exports = {
	updateCommands
}