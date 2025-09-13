const characterList = document.getElementById('character-list');
const characterDetails = document.getElementById('character-details');
const resetBtn = document.getElementById('reset-btn');
const newAnimalForm = document.getElementById('new-animal-form');

let characters = [];
let currentCharacter = null;

// Fetch characters from server
async function fetchCharacters() {
  try {
    const response = await fetch('http://localhost:3000/characters');
    characters = await response.json();
    displayCharacterNames();
  } catch (error) {
    console.error('Error fetching characters:', error);
  }
}

// Display character names
function displayCharacterNames() {
  let namesDiv = characterList.querySelector('h2').nextElementSibling;
  if (!namesDiv) {
    namesDiv = document.createElement('div');
    characterList.appendChild(namesDiv);
  }
  namesDiv.innerHTML = '';
  characters.forEach(character => {
    const nameDiv = document.createElement('div');
    nameDiv.className = 'character-name';
    nameDiv.textContent = character.name;
    nameDiv.addEventListener('click', () => showCharacterDetails(character.id));
    namesDiv.appendChild(nameDiv);
  });
}

// Show character details
async function showCharacterDetails(id) {
  try {
    const response = await fetch(`http://localhost:3000/characters/${id}`);
    const character = await response.json();
    currentCharacter = character;
    characterDetails.innerHTML = `
      <h2>${character.name}</h2>
      <img src="${character.image}" alt="${character.name}">
      <p>Votes: <span id="votes">${character.votes}</span></p>
      <form id="vote-form">
        <label for="vote-count">Add Votes:</label>
        <input type="number" id="vote-count" min="1" required>
        <button type="submit">Vote</button>
      </form>
    `;
    document.getElementById('vote-form').addEventListener('submit', handleVote);
  } catch (error) {
    console.error('Error fetching character details:', error);
  }
}

// Handle vote submission
async function handleVote(event) {
  event.preventDefault();
  const voteCount = parseInt(document.getElementById('vote-count').value);
  if (currentCharacter && voteCount > 0) {
    currentCharacter.votes += voteCount;
    document.getElementById('votes').textContent = currentCharacter.votes;
    // Update in characters array
    const index = characters.findIndex(c => c.id === currentCharacter.id);
    if (index !== -1) {
      characters[index].votes = currentCharacter.votes;
    }
    // Persist vote update to server
    try {
      const response = await fetch(`http://localhost:3000/characters/${currentCharacter.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ votes: currentCharacter.votes })
      });
      if (!response.ok) {
        console.error('Failed to update votes on server');
      }
    } catch (error) {
      console.error('Error updating votes on server:', error);
    }
  }
  event.target.reset();
}

// Reset all votes
async function resetVotes() {
  try {
    await Promise.all(characters.map(async (character) => {
      character.votes = 0;
      await fetch(`http://localhost:3000/characters/${character.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ votes: 0 })
      });
    }));
    if (currentCharacter) {
      currentCharacter.votes = 0;
      document.getElementById('votes').textContent = '0';
    }
    displayCharacterNames(); // Refresh names if needed
  } catch (error) {
    console.error('Error resetting votes:', error);
  }
}

// Handle new animal form submission
newAnimalForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = document.getElementById('name').value;
  const image = document.getElementById('image').value;
  const newCharacter = {
    name,
    image,
    votes: 0
  };
  try {
    const response = await fetch('http://localhost:3000/characters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newCharacter)
    });
    if (response.ok) {
      const addedCharacter = await response.json();
      characters.push(addedCharacter);
      displayCharacterNames();
      event.target.reset();
    } else {
      console.error('Error adding new character');
    }
  } catch (error) {
    console.error('Error adding new character:', error);
  }
});

// Event listeners
resetBtn.addEventListener('click', resetVotes);

// Initialize
fetchCharacters();
