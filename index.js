const { Client, Events, GatewayIntentBits, REST, Routes } = require("discord.js");
const keepalive = require('./keep_alive.js')
const axios = require('axios');

// Reemplaza con tu clave API y el ID del jugador
const apiKey = process.env.BRAWL_API_KEY;
const playerTag = process.env.BRAWL_PLAYER_TAG; // sin el #

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Al estar listo el bot
client.once(Events.ClientReady, async () => {
    console.log(`Conectado como ${client.user.username}`);
    
    // Registrar el comando /up
    const rest = new REST({ version: '10' }).setToken(process.env.BRAWL_API_KEY);
    try {
        console.log('Registrando comando /up...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            {
                body: [{
                    name: 'up',
                    description: 'Consulta la última partida de Brawl Stars.'
                }]
            }
        );
        console.log('Comando /up registrado con éxito.');
    } catch (error) {
        console.error('Error registrando el comando /up:', error);
    }
});

// Escuchar el evento interactionCreate para detectar el comando /up
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'up') {
        // Llamar a la API de Brawl Stars
        const url = `https://api.brawlstars.com/v1/players/%23${playerTag}/battlelog`;

        try {
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            const battleLog = response.data.items;
            if (battleLog && battleLog.length > 0) {
                const lastBattle = battleLog[0]; // Última partida
                let battleTime = lastBattle.battleTime;

                // Reformatar battleTime a 'YYYY-MM-DDTHH:MM:SSZ'
                const formattedBattleTime = battleTime.replace(
                    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.000Z$/,
                    '$1-$2-$3T$4:$5:$6Z'
                );

                let battleDate = new Date(formattedBattleTime);
                let battleDateColombia = new Date(battleDate.toLocaleString("en-US", { timeZone: "America/Bogota" }));
                let battleDateArgentina = new Date(battleDate.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));

                if (isNaN(battleDateColombia.getTime()) || isNaN(battleDateArgentina.getTime())) {
                    await interaction.reply('Error al obtener la fecha de la última partida.');
                    return;
                }

                // Obtener las fechas actuales en Colombia y Argentina
                const now = new Date();
                const nowColombia = new Date(now.toLocaleString("en-US", { timeZone: "America/Bogota" }));
                const nowArgentina = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));

                // Calcular diferencia en minutos
                const diffInMsColombia = nowColombia - battleDateColombia;
                const diffInMinutesColombia = Math.floor(diffInMsColombia / (1000 * 60)); // minutos

                const diffInMsArgentina = nowArgentina - battleDateArgentina;
                const diffInMinutesArgentina = Math.floor(diffInMsArgentina / (1000 * 60));

                // Formatear fecha en español
                const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
                const battleDateFormattedColombia = battleDateColombia.toLocaleDateString('es-ES', options);
                const battleDateFormattedArgentina = battleDateArgentina.toLocaleDateString('es-ES', options);

                // Respuesta al comando
                await interaction.reply(`Han pasado: ${diffInMinutesColombia} minutos desde la última partida.\n`);
            } else {
                await interaction.reply('No se encontraron partidas.');
            }
        } catch (error) {
            console.error('Error llamando a la API:', error);
            await interaction.reply('Error al obtener la información de Brawl Stars.');
        }
    }
});

// Conectar cliente a Discord
client.login(process.env.TOKEN);
