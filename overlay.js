// overlay.js
// Twitch Chat Overlay with 7TV emote support

let seventvEmotes = {};
let client = null;

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
  div.innerHTML = `<span class=\"username\">${username}:</span> ${parseEmotes(message)}`;
  chat.appendChild(div);
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
    if (chatContainer) chatContainer.style.display = '';
    if (document.getElementById('setup-container')) document.getElementById('setup-container').style.display = 'none';
    startChat(username);
  }
});
