import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

async function askDeepSeek(prompt) {
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful Discord AI assistant.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    return `Error calling DeepSeek API: ${error.message}`;
  }
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.mentions.has(client.user) || message.content.startsWith('!ask')) {
    const prompt = message.content
      .replace(/<@!?\d+>/g, '')
      .replace('!ask', '')
      .trim();

    if (!prompt) {
      return message.reply('Please provide a prompt!');
    }

    await message.channel.sendTyping();
    const reply = await askDeepSeek(prompt);

    if (reply.length > 2000) {
      for (let i = 0; i < reply.length; i += 1900) {
        await message.channel.send(reply.slice(i, i + 1900));
      }
    } else {
      await message.reply(reply);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
