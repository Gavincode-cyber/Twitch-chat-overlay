// overlay.js
// Twitch Chat Overlay with 7TV emote support

let seventvEmotes = {};
let client = null;

// Fetch 7TV emotes for the channel
async function fetch7TVEmotes(channel) {
  try {
    // Get channel ID from Twitch API
    const userRes = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${channel}`);
    const userData = await userRes.json();
    const channelId = userData[0]?.id;
    if (!channelId) return;

    // Get 7TV emotes for the channel
    const res = await fetch(`https://7tv.io/v3/users/twitch/${channelId}`);
    const data = await res.json();
    if (data.emote_set && data.emote_set.emotes) {
      data.emote_set.emotes.forEach(e => {
        seventvEmotes[e.name] = `https://cdn.7tv.app/emote/${e.id}/4x.webp`;
      });
    }
  } catch (e) {
    console.error('Failed to fetch 7TV emotes:', e);
  }
}

// Parse message and replace emote codes with images
function parseEmotes(message) {
  return message.split(/(\s+)/).map(word => {
    if (seventvEmotes[word]) {
      return `<img class=\"emote\" src=\"${seventvEmotes[word]}\" alt=\"${word}\" />`;
    }
    return word;
  }).join('');
}

// Add message to chat overlay
function addMessage(username, message) {
  const chat = document.getElementById('chat-container');
  const div = document.createElement('div');
  div.className = 'chat-message';
  div.innerHTML = `<span class=\"username\">${username}:</span> ${parseEmotes(message)}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// Connect to Twitch chat for a given channel
async function startChat(channel) {
  document.getElementById('chat-container').innerHTML = '';
  seventvEmotes = {};
  await fetch7TVEmotes(channel);
  if (client) {
    try { await client.disconnect(); } catch (e) {}
  }
  client = new tmi.Client({
    channels: [channel]
  });
  client.connect();
  client.on('message', (channel, tags, message, self) => {
    if (self) return;
    addMessage(tags['display-name'] || tags.username, message);
  });
}

// Handle username form
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('username-form');
  const input = document.getElementById('username-input');
  const setupContainer = document.getElementById('setup-container');
  const chatContainer = document.getElementById('chat-container');
  if (form && input) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = input.value.trim().toLowerCase();
      if (!username) return;
      setupContainer.style.display = 'none';
      chatContainer.style.display = '';
      await startChat(username);
    });
  }
});
