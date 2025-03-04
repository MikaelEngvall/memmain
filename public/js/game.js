// Socket.IO connection
let playerName = localStorage.getItem('playerName') || '';
const socket = io({
    query: {
        name: playerName
    });
});
                buttonContainer.appendChild(playAgainButton);
                buttonContainer.appendChild(exitButton);
                modalContent.appendChild(buttonContainer);
                gameOverModal.appendChild(modalContent);
                
        document.body.appendChild(gameOverModal);
// Game state variables
let gameId = null;
let playerId = null;
let isMyTurn = false;
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let players = [];
let totalPairs = 0;

// DOM elements
const gameSetup = document.getElementById('game-setup');
const gameInfo = document.getElementById('game-info');
const gameBoard = document.getElementById('game-board');
const gameStatus = document.getElementById('game-status');
const playerList = document.getElementById('player-list');
const waitingRoom = document.getElementById('waiting-room');

// Buttons and inputs
const createGameBtn = document.getElementById('create-game');
const joinGameBtn = document.getElementById('join-game');
const startGameBtn = document.getElementById('start-game');
const copyGameIdBtn = document.getElementById('copy-game-id');

// Game info elements
const currentGameIdEl = document.getElementById('current-game-id');
const playerCountEl = document.getElementById('player-count');
const currentPlayerNameEl = document.getElementById('current-player-name');
const playerTurnEl = document.getElementById('player-turn');
const statusMessageEl = document.getElementById('status-message');
const waitingPlayerCountEl = document.getElementById('waiting-player-count');
const playersContainerEl = document.getElementById('players-container');

// Form inputs
const playerNameInput = document.getElementById('player-name');
const joinNameInput = document.getElementById('join-name');
const gameIdInput = document.getElementById('game-id');

// Toast container
const toastContainer = document.getElementById('toast-container');

// Event listeners for UI
window.addEventListener('DOMContentLoaded', () => {
    // Restore player name from localStorage if available
    if (playerName) {
        playerNameInput.value = playerName;
        joinNameInput.value = playerName;
    }
    
    createGameBtn.addEventListener('click', createGame);
    joinGameBtn.addEventListener('click', joinGame);
    if (copyGameIdBtn) {
        copyGameIdBtn.addEventListener('click', copyGameId);
    }
    if (startGameBtn) {
        startGameBtn.addEventListener('click', startGame);
    }
    
    // Add enter key support for form fields
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            createGame();
        }
    });
    
    joinNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && gameIdInput.value.trim()) {
            joinGame();
        }
    });
    
    gameIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && joinNameInput.value.trim()) {
            joinGame();
        }
    });
});

// Create a new game
function createGame() {
    playerName = playerNameInput.value.trim();
    if (!playerName) {
        showToast('Please enter your name', 'error');
        return;
    }
    
    // Store name in localStorage for next time
    localStorage.setItem('playerName', playerName);
    
    // Reconnect socket with the name
    socket.io.opts.query = { name: playerName };
    socket.disconnect().connect();
    
    // Emit create game event
    socket.emit('createGame');
}

// Join an existing game
function joinGame() {
    const gameIdToJoin = gameIdInput.value.trim();
    playerName = joinNameInput.value.trim();
    
    if (!gameIdToJoin) {
        showToast('Please enter a game ID', 'error');
        return;
    }
    
    if (!playerName) {
        showToast('Please enter your name', 'error');
        return;
    }
    
    // Store name in localStorage for next time
    localStorage.setItem('playerName', playerName);
    
    // Reconnect socket with the name
    socket.io.opts.query = { name: playerName };
    socket.disconnect().connect();
    
    // Emit join game event
    socket.emit('joinGame', gameIdToJoin);
}

// Start the game
function startGame() {
    if (!gameId) {
        showToast('Game not created yet', 'error');
        return;
    }
    
    socket.emit('startGame', gameId);
}

// Update game board with cards
function renderGameBoard() {
    gameBoard.innerHTML = '';
    
    if (cards.length === 0) return;
    
    // Calculate grid columns based on card count
    const columns = Math.min(6, Math.ceil(Math.sqrt(cards.length))); // Limit to max 6 columns for better UI
    gameBoard.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    
    // Use the card template for consistency
    const cardTemplate = document.getElementById('card-template');
    
    cards.forEach((card, index) => {
        // Clone the template
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        cardElement.dataset.index = index;
        cardElement.dataset.cardId = card.id;
        
        if (card.flipped) {
            cardElement.classList.add('flipped');
        }
        
        if (card.matched) {
            cardElement.classList.add('matched');
        }
        
        const cardInner = document.createElement('div');
        cardInner.classList.add('card-inner');
        
        const cardFront = document.createElement('div');
        cardFront.classList.add('card-front');
        cardFront.innerHTML = '<span class="card-content">?</span>';
        
        const cardBack = document.createElement('div');
        cardBack.classList.add('card-back');
        
        // For image symbols
        if (card.symbol.startsWith('http')) {
            const img = document.createElement('img');
            img.src = card.symbol;
            img.alt = 'Card Image';
            img.classList.add('card-image');
            cardBack.appendChild(img);
        } else {
            // For emoji or text symbols
            const span = document.createElement('span');
            span.classList.add('card-content');
            span.textContent = card.symbol;
            cardBack.appendChild(span);
        }
        
        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        cardElement.appendChild(cardInner);
        
        // Add event listener for card click
        cardElement.addEventListener('click', () => {
            if (isMyTurn && !card.flipped && !card.matched) {
                socket.emit('selectCard', { gameId, cardIndex: index });
            } else if (!isMyTurn) {
                showToast("Not your turn!");
            }
        });
        
        gameBoard.appendChild(cardElement);
    });
}

// Handle card flip
function flipCard(index) {
// Only allow flipping if it's the player's turn and the card isn't already flipped or matched
if (!isMyTurn || flippedCards.length >= 2 || 
    cards[index].isFlipped || cards[index].flipped || 
    cards[index].isMatched || cards[index].matched) {
    if (!isMyTurn) {
        showToast("It's not your turn yet!");
    } else if (flippedCards.length >= 2) {
        showToast("Wait for the current pair to be resolved");
    }
    return;
}

// Emit flip card event to server
socket.emit('flipCard', { gameId, playerId, cardIndex: index });
}

// Update player list display
function updatePlayerList() {
playersContainer.innerHTML = '';

players.forEach(player => {
    const playerElement = document.createElement('div');
    playerElement.classList.add('player');
    
    if (player.id === playerId) {
    playerElement.classList.add('current-player');
    }
    
    if (player.isTurn) {
    playerElement.classList.add('active-turn');
    }
    
    playerElement.innerHTML = `
    <span class="player-name">${player.name}</span>
    <span class="player-score">Score: ${player.score}</span>
    `;
    
    playersContainer.appendChild(playerElement);
});
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.classList.add(type);
    
    const toastHeader = document.createElement('div');
    toastHeader.classList.add('toast-header');
    
    const toastTitle = document.createElement('div');
    toastTitle.classList.add('toast-title');
    toastTitle.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    
    const toastClose = document.createElement('div');
    toastClose.classList.add('toast-close');
    toastClose.textContent = '×';
    toastClose.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    });
    
    toastHeader.appendChild(toastTitle);
    toastHeader.appendChild(toastClose);
    
    const toastBody = document.createElement('div');
    toastBody.classList.add('toast-body');
    toastBody.textContent = message;
    
    toast.appendChild(toastHeader);
    toast.appendChild(toastBody);
    
    toastContainer.appendChild(toast);
    
    // Fade in
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode === toastContainer) {
                toastContainer.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Update turn information
function updateTurnInfo() {
    // Find the player whose turn it is
    const currentPlayer = players.find(p => p.isTurn);
    
    if (currentPlayer) {
        if (currentPlayer.id === playerId) {
            playerTurnEl.textContent = 'Your turn!';
            playerTurnEl.classList.add('your-turn');
            isMyTurn = true;
        } else {
            playerTurnEl.textContent = `${currentPlayer.name}'s turn`;
            playerTurnEl.classList.remove('your-turn');
            isMyTurn = false;
        }
    }
}

// Switch between screens (lobby <-> game)
function showScreen(screenId) {
    if (screenId === 'setup') {
        gameSetup.classList.remove('hidden');
        gameInfo.classList.add('hidden');
        gameBoard.classList.add('hidden');
        gameStatus.classList.add('hidden');
        playerList.classList.add('hidden');
        waitingRoom.classList.add('hidden');
    } else if (screenId === 'game') {
        gameSetup.classList.add('hidden');
        gameInfo.classList.remove('hidden');
        gameBoard.classList.remove('hidden');
        gameStatus.classList.remove('hidden');
        playerList.classList.remove('hidden');
        waitingRoom.classList.add('hidden');
    } else if (screenId === 'waiting') {
        gameSetup.classList.add('hidden');
        gameInfo.classList.remove('hidden');
        gameBoard.classList.add('hidden');
        gameStatus.classList.add('hidden');
        playerList.classList.remove('hidden');
        waitingRoom.classList.remove('hidden');
    }
}

// Copy game ID to clipboard
function copyGameId() {
    const gameId = currentGameIdEl.textContent;
    navigator.clipboard.writeText(gameId)
        .then(() => {
            showToast('Game ID copied to clipboard!', 'success');
        })
        .catch(err => {
            console.error('Could not copy game ID: ', err);
            showToast('Failed to copy Game ID', 'error');
        });
}

// Check if the game is over
function checkGameOver() {
    if (matchedPairs === totalPairs) {
        // Find winner(s) - player(s) with highest score
        const highestScore = Math.max(...players.map(p => p.score));
        const winners = players.filter(p => p.score === highestScore);
        
        let message = 'Game Over! ';
        
        if (winners.length === 1) {
            message += `${winners[0].name} wins with ${highestScore} pairs!`;
        } else {
            const winnerNames = winners.map(w => w.name).join(' and ');
            message += `It's a tie between ${winnerNames} with ${highestScore} pairs each!`;
        }
        
        // Create a modal for game over instead of alert
        const gameOverModal = document.createElement('div');
        gameOverModal.classList.add('game-over-modal');
        
        const modalContent = document.createElement('div');
        modalContent.classList.add('modal-content');
        
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        modalContent.appendChild(messageElement);
        
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');
        
        const playAgainButton = document.createElement('button');
        playAgainButton.textContent = 'Play Again';
        playAgainButton.classList.add('btn', 'btn-primary');
        playAgainButton.addEventListener('click', () => {
            document.body.removeChild(gameOverModal);
            socket.emit('restartGame', { gameId });
        });
        
        const exitButton = document.createElement('button');
        exitButton.textContent = 'Exit to Lobby';
        exitButton.addEventListener('click', () => {
            document.body.removeChild(gameOverModal);
            showScreen('setup');
        });
        buttonContainer.appendChild(playAgainButton);
        buttonContainer.appendChild(exitButton);
        modalContent.appendChild(buttonContainer);
        gameOverModal.appendChild(modalContent);
        
        document.body.appendChild(gameOverModal);
    }
}

// Socket.IO event handlers
socket.on('connect', () => {
    console.log('Connected to server!');
    playerId = socket.id;
});

socket.on('playerJoined', (data) => {
players = data.players;
updatePlayerList();
});

socket.on('gameStarted', (data) => {
cards = data.cards;
totalPairs = data.totalPairs;
players = data.players;

// Update UI
// Use waitingRoom instead of waitingMessage to match HTML
if (waitingRoom) {
    waitingRoom.classList.add('hidden');
}
gameBoard.classList.remove('hidden');

// Update game state
updatePlayerList();
updateTurnInfo();
renderGameBoard();
});
socket.on('gameJoined', (data) => {
gameId = data.gameId;
playerId = data.playerId;
players = data.players;

if (data.gameInProgress) {
    cards = data.cards;
    totalPairs = data.totalPairs;
    matchedPairs = data.matchedPairs;
    
    // Update UI
    // Use waitingRoom instead of waitingMessage to match HTML
    if (waitingRoom) {
        waitingRoom.classList.add('hidden');
    }
    gameBoard.classList.remove('hidden');
} else {
    // Waiting for more players
    if (waitingRoom) {
        waitingRoom.classList.remove('hidden');
    }
    gameBoard.classList.add('hidden');
}
}

// Update UI
// Use currentGameIdEl instead of gameIdDisplay to match HTML
if (currentGameIdEl) {
    currentGameIdEl.textContent = gameId;
}
showScreen('game');

// Update game state
updatePlayerList();
updateTurnInfo();
renderGameBoard();

socket.on('cardFlipped', (data) => {
const { cardIndex, cardData } = data;

// Update card state
cards[cardIndex] = { ...cards[cardIndex], ...cardData };

// Play flip sound
// Try to use preloaded audio element first, fall back to creating new Audio if needed
try {
    const flipSound = document.getElementById('flip-sound') || new Audio('/sounds/flip.mp3');
    flipSound.volume = 0.5;
    // Reset sound to beginning
    flipSound.currentTime = 0;
    flipSound.play().catch(e => console.log('Error playing flip sound:', e));
} catch (error) {
    console.log('Could not play flip sound:', error);
}

// Update flipped cards array
// Handle both isFlipped and flipped property names for robustness
if ((cardData.isFlipped || cardData.flipped) && !(cardData.isMatched || cardData.matched)) {
    flippedCards.push(cardIndex);
}

// Render the updated board
renderGameBoard();
});


socket.on('checkMatch', (data) => {
const { matched, cardIndices } = data;

if (matched) {
    // Play match sound
    try {
        const matchSound = document.getElementById('match-sound') || new Audio('/sounds/match.mp3');
        matchSound.volume = 0.6;
        matchSound.currentTime = 0; // Reset sound to beginning
        matchSound.play().catch(e => console.log('Error playing match sound:', e));
    } catch (error) {
        console.log('Could not play match sound:', error);
    }
    
    // Update matched cards
    cardIndices.forEach(index => {
        // Set both isMatched and matched properties for robustness
        cards[index].isMatched = true;
        cards[index].matched = true;
        
        // Add visual feedback for matched cards
        const cardElements = document.querySelectorAll(`.card[data-index="${index}"]`);
        cardElements.forEach(el => {
            el.classList.add('matched');
            // Add a small animation
            el.animate([
                { transform: 'scale(1)', opacity: 1 },
                { transform: 'scale(1.1)', opacity: 1 },
                { transform: 'scale(1)', opacity: 0.8 }
            ], {
                duration: 500,
                iterations: 1
            });
        });
    });
    
    matchedPairs++;
    
    // Show a message about who got the match
    const currentPlayer = players.find(p => p.isTurn);
    if (currentPlayer) {
        showToast(`${currentPlayer.name} found a match!`);
    }
    
    checkGameOver();
} else {
    // Play no-match sound
    try {
        const noMatchSound = document.getElementById('no-match-sound') || new Audio('/sounds/no-match.mp3');
        noMatchSound.volume = 0.4;
        noMatchSound.currentTime = 0; // Reset sound to beginning
        noMatchSound.play().catch(e => console.log('Error playing no-match sound:', e));
    } catch (error) {
        console.log('Could not play no-match sound:', error);
    }
    
    // Show a message
    showToast("No match! Cards will flip back.");
    
    // Flip cards back after a short delay
    setTimeout(() => {
        cardIndices.forEach(index => {
            // Set both isFlipped and flipped properties to false for robustness
            cards[index].isFlipped = false;
            cards[index].flipped = false;
        });
        renderGameBoard();
    }, 1500); // Slightly longer delay to better see the cards
}

// Reset flipped cards
flippedCards = [];
});

socket.on('turnChanged', (data) => {
players = data.players;
updatePlayerList();
updateTurnInfo();
});

socket.on('scoreUpdated', (data) => {
players = data.players;
updatePlayerList();
});

socket.on('gameError', (data) => {
alert(data.message);
});

socket.on('gameRestarted', (data) => {
// Reset game state
cards = data.cards;
totalPairs = data.totalPairs;
matchedPairs = 0;
flippedCards = [];
players = data.players;

// Update UI
updatePlayerList();
updateTurnInfo();
renderGameBoard();
});
