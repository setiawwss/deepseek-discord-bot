import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

async function askOpenRouter(prompt) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://railway.app', // Required by OpenRouter for ranking
        'X-Title': 'Discord Bot', // Optional site name for OpenRouter
      },
      body: JSON.stringify({
        // Model ID for Nvidia Nemotron on OpenRouter:
        model: 'nvidia/llama-3.1-nemotron-70b-instruct',
        messages: [
          { role: 'system', content: 'You are a helpful Discord AI assistant.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    const data = await response.json();

    // Catch API errors from OpenRouter
    if (!response.ok || data.error) {
      console.error('OpenRouter API Error Payload:', data);
      return `OpenRouter API Error: ${data.error?.message || response.statusText}`;
    }

    if (!data.choices || !data.choices[0]) {
      console.error('Unexpected API Response:', data);
      return 'Received an empty response from OpenRouter API.';
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Fetch Error:', error);
    return `Error calling OpenRouter API: ${error.message}`;
  }
}

client.on('clientReady', () => {
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
    const reply = await askOpenRouter(prompt);

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
