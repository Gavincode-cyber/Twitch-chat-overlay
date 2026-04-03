// overlay.js
// Twitch Chat Overlay with 7TV emote support

let seventvEmotes = {};
let client = null;
const usernameColors = {};
const colorPalette = [
  '#FF69B4', '#1E90FF', '#32CD32', '#FFD700', '#FF4500', '#00CED1', '#DA70D6', '#FF6347', '#7FFF00', '#00BFFF',
  '#FF1493', '#ADFF2F', '#FFA500', '#20B2AA', '#BA55D3', '#00FF7F', '#DC143C', '#00FA9A', '#8A2BE2', '#FFB6C1'
];
function getUsernameColor(username) {
  if (!usernameColors[username]) {
    // Assign a color based on hash for consistency
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = colorPalette[Math.abs(hash) % colorPalette.length];
    usernameColors[username] = color;
  }
  return usernameColors[username];
}

// Fetch 7TV emotes for the channel
async function fetch7TVEmotes(channel) {
  try {
    const userRes = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${channel}`);
    const userData = await userRes.json();
    const channelId = userData[0]?.id;
    if (!channelId) return;
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

function parseEmotes(message) {
  return message.split(/(\s+)/).map(word => {
    if (seventvEmotes[word]) {
      return `<img class=\"emote\" src=\"${seventvEmotes[word]}\" alt=\"${word}\" />`;
    }
    return word;
  }).join('');
}

function addMessage(username, message) {
  const chat = document.getElementById('chat-container');
  const div = document.createElement('div');
  div.className = 'chat-message';
  const color = getUsernameColor(username.toLowerCase());
  div.innerHTML = `<span class=\"username\" style=\"--username-color: ${color}\">${username}:</span> ${parseEmotes(message)}`;
  chat.appendChild(div);
  // Limit to last 20 messages
  while (chat.children.length > 20) {
    chat.removeChild(chat.firstChild);
  }
  chat.scrollTop = chat.scrollHeight;
}

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

// Utility to get URL parameter
function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

document.addEventListener('DOMContentLoaded', () => {
  const chatContainer = document.getElementById('chat-container');
  const username = getQueryParam('user');
  if (username) {
    // Add overlay-only class to body for transparent, chat-only mode
    document.body.classList.add('overlay-only');
    if (chatContainer) chatContainer.style.display = '';
    if (document.getElementById('setup-container')) document.getElementById('setup-container').style.display = 'none';
    startChat(username);
  }
});
