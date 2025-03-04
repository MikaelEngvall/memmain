// Socket.IO connection
let playerName = localStorage.getItem('playerName') || '';
const socket = io({
    query: {
        name: playerName
    }
});

// Game state variables
let gameId = null;
let playerId = null;
let isMyTurn = false;
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let players = [];
let totalPairs = 0;
let isGameCreator = false;
let gameOptions = {
    maxPlayers: 5,
    cardTheme: 'mixed',
    cardCount: 24
};

// DOM elements
const gameSetup = document.getElementById('game-setup');
const gameInfo = document.getElementById('game-info');
const gameBoard = document.getElementById('game-board');
const gameStatus = document.getElementById('game-status');
const playerList = document.getElementById('player-list');
const waitingRoom = document.getElementById('waiting-room');
const gameOptionsEl = document.getElementById('game-options');

// Buttons and inputs
const createGameBtn = document.getElementById('create-game');
const joinGameBtn = document.getElementById('join-game');
const startGameBtn = document.getElementById('start-game');
const copyGameIdBtn = document.getElementById('copy-game-id');
const updateOptionsBtn = document.getElementById('update-options');

// Game info elements
const currentGameIdEl = document.getElementById('current-game-id');
const playerCountEl = document.getElementById('player-count');
const maxPlayerCountEl = document.getElementById('max-player-count');
const currentPlayerNameEl = document.getElementById('current-player-name');
const playerTurnEl = document.getElementById('player-turn');
const statusMessageEl = document.getElementById('status-message');
const waitingPlayerCountEl = document.getElementById('waiting-player-count');
const waitingMaxPlayersEl = document.getElementById('waiting-max-players');
const playersContainerEl = document.getElementById('players-container');

// Form inputs
const playerNameInput = document.getElementById('player-name');
const joinNameInput = document.getElementById('join-name');
const gameIdInput = document.getElementById('game-id');

// Game options inputs
const maxPlayersInput = document.getElementById('max-players');
const cardThemeInput = document.getElementById('card-theme');
const cardCountInput = document.getElementById('card-count');
const editMaxPlayersInput = document.getElementById('edit-max-players');
const editCardThemeInput = document.getElementById('edit-card-theme');
const editCardCountInput = document.getElementById('edit-card-count');

// Sound elements
const flipSound = document.getElementById('flip-sound');
const flipSound2 = document.getElementById('flip-sound-2');
const flipSound3 = document.getElementById('flip-sound-3');
const matchSound = document.getElementById('match-sound');
const noMatchSound = document.getElementById('no-match-sound');

// Array med alla tillgängliga flip-ljud
const flipSounds = [flipSound, flipSound2, flipSound3].filter(sound => sound !== null);

// Toast container
const toastContainer = document.getElementById('toast-container');

// Load audio
function loadAudio() {
    console.log('Laddar ljudfiler...');
    
    try {
        // Kontrollera att våra ljudelement finns
        if (!flipSound) {
            console.error('Ljudelement "flip-sound" hittades inte!');
        } else {
            console.log('Laddar flip-sound', flipSound.src);
            flipSound.load();
        }
        
        // Ladda alternativa ljud om de finns tillgängliga
        if (flipSound2) {
            console.log('Laddar flip-sound-2', flipSound2.src);
            flipSound2.load();
        } else {
            console.log('flip-sound-2 saknas');
        }
        
        if (flipSound3) {
            console.log('Laddar flip-sound-3', flipSound3.src);
            flipSound3.load();
        } else {
            console.log('flip-sound-3 saknas');
        }
        
        if (matchSound) {
            console.log('Laddar match-sound', matchSound.src);
            matchSound.load();
        } else {
            console.error('Ljudelement "match-sound" hittades inte!');
        }
        
        if (noMatchSound) {
            console.log('Laddar no-match-sound', noMatchSound.src);
            noMatchSound.load();
        } else {
            console.error('Ljudelement "no-match-sound" hittades inte!');
        }
        
        // Uppdatera flipSounds-arrayen efter att vi laddat ljuden
        const availableFlipSounds = [flipSound, flipSound2, flipSound3].filter(sound => sound !== null);
        console.log(`${availableFlipSounds.length} flip-ljud tillgängliga`);
        
    } catch (error) {
        console.warn('Audio loading error:', error);
    }
}

// Play sound with error handling
function playSound(sound) {
    console.log('Försöker spela ljud:', sound ? sound.id : 'inget ljud');
    try {
        if (sound && typeof sound.play === 'function') {
            console.log('Återställer och spelar ljudet');
            sound.currentTime = 0;
            
            // Begränsa uppspelningen till 0,5 sekunder för flip-ljudet
            if (sound.id === 'flip-sound' || sound.id.startsWith('flip-sound')) {
                setTimeout(() => {
                    if (!sound.paused) {
                        console.log('Pausar flip-ljud efter timeout');
                        sound.pause();
                        sound.currentTime = 0;
                    }
                }, 500); // Stoppa ljudet efter 0,5 sekunder
            }
            
            // Försök spela ljudet och hantera eventuella fel
            sound.play()
                .then(() => {
                    console.log('Ljud spelas nu:', sound.id);
                })
                .catch(error => {
                    console.warn('Audio play error:', error);
                });
        } else {
            console.warn('Ogiltigt ljud-objekt:', sound);
        }
    } catch (error) {
        console.warn('Error playing sound:', error);
    }
}

// Ljudvariation för kortflippning
function playFlipSound() {
    console.log('playFlipSound anropad, tillgängliga ljud:', flipSounds.length);
    
    // Om vi har flera flip-ljud, välj ett slumpmässigt
    if (flipSounds.length > 1) {
        const randomIndex = Math.floor(Math.random() * flipSounds.length);
        console.log('Väljer ljud index', randomIndex, 'av', flipSounds.length);
        playSound(flipSounds[randomIndex]);
    } else if (flipSounds.length === 1) {
        // Annars använd det första/enda ljudet
        console.log('Använder enda tillgängliga flip-ljud');
        playSound(flipSounds[0]);
    } else {
        console.warn('Inga flip-ljud tillgängliga!');
    }
}

// Test card flip animation
function testCardFlip() {
    console.log('Testar kortflippning...');
    
    // Skapa ett testkort
    const testCard = document.createElement('div');
    testCard.classList.add('card');
    testCard.style.position = 'fixed';
    testCard.style.top = '50%';
    testCard.style.left = '50%';
    testCard.style.transform = 'translate(-50%, -50%)';
    testCard.style.zIndex = '9999';
    
    const cardInner = document.createElement('div');
    cardInner.classList.add('card-inner');
    
    const cardFront = document.createElement('div');
    cardFront.classList.add('card-front');
    cardFront.innerHTML = '<span class="card-content">?</span>';
    
    const cardBack = document.createElement('div');
    cardBack.classList.add('card-back');
    cardBack.innerHTML = '<span class="card-content">TEST</span>';
    
    cardInner.appendChild(cardFront);
    cardInner.appendChild(cardBack);
    testCard.appendChild(cardInner);
    
    document.body.appendChild(testCard);
    
    // Flippa kortet efter en kort fördröjning
    setTimeout(() => {
        console.log('Flippar testkortet...');
        testCard.classList.add('flipped');
        playFlipSound();
        
        // Ta bort testkortet efter en stund
        setTimeout(() => {
            document.body.removeChild(testCard);
        }, 3000);
    }, 1000);
}

// Event listeners for UI
window.addEventListener('DOMContentLoaded', () => {
    // Load audio files
    loadAudio();
    
    // Test sound playback and card flip
    setTimeout(() => {
        console.log('Testar ljuduppspelning...');
        if (flipSounds.length > 0) {
            console.log('Spelar testljud');
            playSound(flipSounds[0]);
            
            // Testa kortflippning
            testCardFlip();
        } else {
            console.error('Inga flip-ljud tillgängliga för test!');
        }
    }, 2000);
    
    // Set player name from localStorage if available
    if (playerName) {
        playerNameInput.value = playerName;
        joinNameInput.value = playerName;
    }
    
    // Event listeners for buttons
    createGameBtn.addEventListener('click', createGame);
    joinGameBtn.addEventListener('click', joinGame);
    startGameBtn.addEventListener('click', startGame);
    copyGameIdBtn.addEventListener('click', copyGameId);
    updateOptionsBtn.addEventListener('click', updateGameOptions);
    
    // Show setup screen
    showScreen('setup');
    
    // Socket event listeners
    socket.on('connect', () => {
        console.log('Ansluten till servern med ID:', socket.id);
        playerId = socket.id;
    });
    
    socket.on('error', (error) => {
        console.error('Serverfel:', error);
        handleError(error);
    });
    
    socket.on('gameCreated', (createdGameId) => {
        console.log('Spel skapat med ID:', createdGameId);
        handleGameCreated(createdGameId);
    });
    
    socket.on('gameJoined', (data) => {
        console.log('Ansluten till spel:', data);
        handleGameJoined(data);
    });
    
    socket.on('playerJoined', (data) => {
        console.log('Spelare ansluten:', data);
        handlePlayerJoined(data);
    });
    
    socket.on('playerLeft', (data) => {
        console.log('Spelare lämnade:', data);
        handlePlayerLeft(data);
    });
    
    socket.on('gameOptionsUpdated', (options) => {
        console.log('Spelalternativ uppdaterade:', options);
        handleGameOptionsUpdated(options);
    });
    
    socket.on('gameStarted', (data) => {
        console.log('Spelet startar med data:', data);
        
        // Hide waiting room and show game board
        showScreen('game');
        
        // Set cards
        cards = data.cards;
        totalPairs = cards.length / 2;
        
        // Set current turn
        isMyTurn = data.currentTurn === playerId;
        
        // Update turn info
        updateTurnInfo();
        
        // Render game board
        console.log('Renderar spelplan med', cards.length, 'kort');
        renderGameBoard();
        
        // Show toast
        showToast('Spelet har börjat!', 'success');
    });
    
    socket.on('cardSelected', (data) => {
        console.log('Kort valt (socket event):', data);
        // Lägg till gameId om det saknas i data
        if (!data.gameId && gameId) {
            data.gameId = gameId;
        }
        handleCardSelected(data);
    });
    
    socket.on('cardMatch', (data) => {
        console.log('Kortmatch:', data);
        handleCardMatch(data);
    });
    
    socket.on('cardsMismatch', (data) => {
        console.log('Ingen kortmatch:', data);
        handleCardsMismatch(data);
    });
    
    socket.on('gameOver', (data) => {
        console.log('Spelet är slut:', data);
        handleGameOver(data);
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
    
    // Get game options
    const maxPlayers = parseInt(maxPlayersInput.value, 10) || 5;
    const cardTheme = cardThemeInput.value || 'mixed';
    const cardCount = parseInt(cardCountInput.value, 10) || 24;
    
    gameOptions = {
        maxPlayers,
        cardTheme,
        cardCount
    };
    
    // Reconnect socket with the name
    socket.io.opts.query = { name: playerName };
    socket.disconnect().connect();
    
    // Show spinner while connecting
    showToast('Creating game...', 'info');
    
    // Emit create game event with options
    socket.emit('createGame', gameOptions);
}

// Handle game created event
function handleGameCreated(createdGameId) {
    gameId = createdGameId;
    isGameCreator = true;
    
    // Update UI
    showScreen('waiting-room');
    currentGameIdEl.textContent = gameId;
    
    // Set options in UI
    maxPlayerCountEl.textContent = gameOptions.maxPlayers;
    waitingMaxPlayersEl.textContent = gameOptions.maxPlayers;
    
    // Update options in edit screen
    editMaxPlayersInput.value = gameOptions.maxPlayers;
    editCardThemeInput.value = gameOptions.cardTheme;
    editCardCountInput.value = gameOptions.cardCount;
    
    // Show game options for creator
    gameOptionsEl.classList.remove('hidden');
    
    // Show waiting room
    waitingPlayerCountEl.textContent = 1;
    waitingRoom.classList.remove('hidden');
    startGameBtn.classList.remove('hidden');
    
    // Show toast
    showToast(`Game created! ID: ${gameId}`, 'success');
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
    
    // Show spinner while connecting
    showToast('Joining game...', 'info');
    
    // Emit join game event
    socket.emit('joinGame', gameIdToJoin);
}

// Handle game joined event
function handleGameJoined(data) {
    if (typeof data === 'string') {
        // Handle old format for backward compatibility
        gameId = data;
    } else {
        // New format with options
        gameId = data.gameId;
        gameOptions = {
            maxPlayers: data.maxPlayers || 5,
            cardTheme: data.cardTheme || 'mixed',
            cardCount: data.cardCount || 24
        };
    }
    
    isGameCreator = false;
    
    // Update UI
    showScreen('waiting-room');
    currentGameIdEl.textContent = gameId;
    
    // Update options display
    maxPlayerCountEl.textContent = gameOptions.maxPlayers;
    waitingMaxPlayersEl.textContent = gameOptions.maxPlayers;
    
    // Hide game options for non-creator
    gameOptionsEl.classList.add('hidden');
    
    // Show waiting room
    waitingRoom.classList.remove('hidden');
    // Hide start button for non-creator
    startGameBtn.classList.add('hidden');
    
    // Show toast
    showToast(`Joined game: ${gameId}`, 'success');
}

// Update game options (for game creator)
function updateGameOptions() {
    if (!isGameCreator) {
        showToast('Only the game creator can change options', 'error');
        return;
    }
    
    const newOptions = {
        maxPlayers: parseInt(editMaxPlayersInput.value, 10),
        cardTheme: editCardThemeInput.value,
        cardCount: parseInt(editCardCountInput.value, 10)
    };
    
    // Update local options
    gameOptions = newOptions;
    
    // Send to server
    socket.emit('updateGameOptions', {
        gameId,
        options: newOptions
    });
    
    showToast('Game options updated', 'success');
}

// Handle game options updated
function handleGameOptionsUpdated(options) {
    // Update local game options
    gameOptions.maxPlayers = options.maxPlayers;
    gameOptions.cardTheme = options.cardTheme;
    gameOptions.cardCount = options.cardCount;
    
    // Update UI elements
    maxPlayerCountEl.textContent = options.maxPlayers;
    waitingMaxPlayersEl.textContent = options.maxPlayers;
    
    // Update edit form if you're the creator
    if (isGameCreator) {
        editMaxPlayersInput.value = options.maxPlayers;
        editCardThemeInput.value = options.cardTheme;
        editCardCountInput.value = options.cardCount;
    }
    
    // Show notification
    showToast('Game options have been updated', 'info');
}

// Handle player joined event
function handlePlayerJoined(data) {
    players = data.players;
    updatePlayerList();
    
    // Update waiting room counters
    waitingPlayerCountEl.textContent = players.length;
    playerCountEl.textContent = players.length;
    
    // Enable start button if at least 2 players and you're the creator
    if (isGameCreator && players.length >= 2) {
        startGameBtn.disabled = false;
    }
    
    // Show notification
    const newPlayer = players.find(p => p.id === data.playerId);
    if (newPlayer && newPlayer.id !== playerId) {
        showToast(`${newPlayer.name} joined the game`, 'info');
    }
}

// Handle player left event
function handlePlayerLeft(data) {
    players = data.players;
    updatePlayerList();
    
    // Update counters
    waitingPlayerCountEl.textContent = players.length;
    playerCountEl.textContent = players.length;
    
    // Disable start button if less than 2 players
    if (players.length < 2) {
        startGameBtn.disabled = true;
    }
    
    // Show notification
    showToast(`A player left the game`, 'info');
}

// Start the game
function startGame() {
    if (!gameId) {
        showToast('Game not created yet', 'error');
        return;
    }
    
    if (players.length < 2) {
        showToast('Need at least 2 players to start', 'error');
        return;
    }
    
    // Emit start game event
    socket.emit('startGame', gameId);
    showToast('Starting game...', 'info');
}

// Handle card click from the UI
function handleCardClick(cardElement, index) {
    console.log(`Kort klickat: index=${index}, min tur=${isMyTurn}`);
    
    // Get the card data
    const card = cards[index];
    
    // Check if it's valid to click this card
    if (!isMyTurn) {
        console.log('Inte min tur att spela');
        showToast("Inte din tur!");
        return;
    }
    
    if (card.flipped || card.matched) {
        console.log('Kortet är redan vänt eller matchat');
        return;
    }
    
    // Send card selection to server
    console.log('Skickar kortval till servern:', gameId, index);
    socket.emit('selectCard', { gameId, cardIndex: index });
}

// Update game board with cards
function renderGameBoard() {
    console.log('Renderar spelplan med', cards.length, 'kort');
    gameBoard.innerHTML = '';
    
    if (cards.length === 0) return;
    
    // Calculate grid layout based on card count
    let columns;
    if (cards.length <= 12) {
        columns = 4; // 3x4 grid for 12 cards
    } else if (cards.length <= 20) {
        columns = 5; // 4x5 grid for 20 cards
    } else if (cards.length <= 36) {
        columns = 6; // 6x6 grid for 36 cards
    } else {
        columns = 8; // 6x8 grid for 48 cards
    }
    
    // Set responsive grid
    if (window.innerWidth < 768) {
        // Mobile view: fewer columns
        columns = Math.min(4, columns);
    }
    
    gameBoard.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    
    cards.forEach((card, index) => {
        // Create card element
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
            img.crossOrigin = "anonymous"; // Lägg till CORS-stöd
            img.src = card.symbol;
            img.alt = 'Card Image';
            img.classList.add('card-image');
            
            // Enklare felhantering och debug-utskrift
            img.onerror = () => {
                console.error('Bilden kunde inte laddas:', card.symbol);
                // Använd en färgad bakgrund istället för platshållarbild
                cardBack.style.backgroundColor = '#f1f1f1';
                const errorText = document.createElement('span');
                errorText.textContent = '!';
                errorText.style.fontSize = '24px';
                errorText.style.color = '#666';
                cardBack.appendChild(errorText);
            };
            
            // Debug-utskrift för att se om bilden laddar korrekt
            img.onload = () => {
                console.log('Bild laddad:', card.symbol);
                cardBack.classList.add('loaded');
            };
            
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
            // Använd ny hjälpfunktion för kortklick
            handleCardClick(cardElement, index);
        });
        
        gameBoard.appendChild(cardElement);
    });
}

// Handle card selected event
function handleCardSelected(data) {
    console.log('Kort valt:', data);
    
    const { gameId: selectedGameId, cardIndex, playerId: selectedPlayerId } = data;
    
    if (gameId !== selectedGameId) {
        console.log('Ignorerar kort från annat spel');
        return;
    }
    
    console.log('Uppdaterar kort:', cardIndex, 'Spelare:', selectedPlayerId);
    
    // Update local game state
    if (cardIndex < cards.length) {
        // Update card state
        cards[cardIndex].flipped = true;
        console.log('Kort data efter uppdatering:', cards[cardIndex]);
        
        // Get the card element - FIX: Använd korrekt selektor
        const cardElement = document.querySelector(`.card[data-index="${cardIndex}"]`);
        console.log('Hittade kortelement:', cardElement ? 'Ja' : 'Nej');
        
        if (cardElement) {
            console.log('Lägger till flipped-klass på element');
            // Add flipped class for animation
            cardElement.classList.add('flipped');
            
            // Ensure card image loads properly
            const cardBack = cardElement.querySelector('.card-back');
            const symbol = cards[cardIndex].symbol;
            console.log('Kortsymbol:', symbol);
            
            if (cardBack && !cardBack.querySelector('.card-image, .card-content')) {
                console.log('Lägger till innehåll på kortets baksida');
                if (symbol.startsWith('http')) {
                    const img = document.createElement('img');
                    img.crossOrigin = "anonymous"; // Lägg till CORS-stöd
                    img.src = symbol;
                    img.alt = 'Card Image';
                    img.classList.add('card-image');
                    
                    // Debug för bildladdningsproblem
                    img.onerror = () => {
                        console.error('Kunde inte ladda bilden i handleCardSelected:', symbol);
                        cardBack.style.backgroundColor = '#f1f1f1';
                        const errorText = document.createElement('span');
                        errorText.textContent = '!';
                        errorText.style.fontSize = '24px';
                        errorText.style.color = '#666';
                        cardBack.appendChild(errorText);
                    };
                    
                    img.onload = () => {
                        console.log('Bild laddad i handleCardSelected:', symbol);
                        cardBack.classList.add('loaded');
                    };
                    
                    cardBack.appendChild(img);
                } else {
                    console.log('Lägger till textsymbol på baksidan:', symbol);
                    const span = document.createElement('span');
                    span.classList.add('card-content');
                    span.textContent = symbol;
                    cardBack.appendChild(span);
                }
            } else {
                console.log('Innehåll finns redan på kortets baksida');
            }
        } else {
            console.error('Kunde inte hitta kortelement för index', cardIndex);
            // Försök att hitta kortet på ett annat sätt
            const allCards = document.querySelectorAll('.card');
            console.log('Antal kort på spelplanen:', allCards.length);
            
            // Logga alla kort för felsökning
            allCards.forEach((card, i) => {
                console.log(`Kort ${i}: data-index=${card.dataset.index}, data-card-id=${card.dataset.cardId}`);
            });
        }
    }
    
    console.log('Spelar flipsound');
    // Play flip sound
    playFlipSound();
    
    // If it's the other player's turn, update the turn info
    if (selectedPlayerId !== playerId) {
        console.log('Uppdaterar tur-info (annan spelares tur)');
        isMyTurn = false;
        updateTurnInfo();
    }
}

// Handle card match event
function handleCardMatch(data) {
    const { cards: matchedCardIndices, playerId: matchPlayerId, players: updatedPlayers } = data;
    
    // Update players and scores
    players = updatedPlayers;
    updatePlayerList();
    
    // Update matched cards
    matchedCardIndices.forEach(index => {
        if (cards[index]) {
            cards[index].matched = true;
        }
        
        const cardElement = document.querySelector(`.card[data-index="${index}"]`);
        if (cardElement) {
            cardElement.classList.add('matched');
        }
    });
    
    // Play match sound
    playSound(matchSound);
    
    // Show toast message
    const playerName = players.find(p => p.id === matchPlayerId)?.name || 'Player';
    showToast(`${playerName} found a match!`, 'success');
    
    // Update turn info
    updateTurnInfo();
    
    // Check game progress
    matchedPairs++;
    const progress = Math.floor((matchedPairs / totalPairs) * 100);
    if (progress === 100) {
        showToast('All pairs found!', 'success');
    }
}

// Handle cards mismatch event
function handleCardsMismatch(data) {
    const { cards: mismatchedCardIndices, nextTurn } = data;
    
    // Update flipped state after animation
    setTimeout(() => {
        mismatchedCardIndices.forEach(index => {
            if (cards[index]) {
                cards[index].flipped = false;
            }
            
            const cardElement = document.querySelector(`.card[data-index="${index}"]`);
            if (cardElement) {
                cardElement.classList.remove('flipped');
            }
        });
        
        // Update turn
        isMyTurn = nextTurn === playerId;
        updateTurnInfo();
        
    }, 1000);
    
    // Play no match sound
    playSound(noMatchSound);
    
    // Show toast when turn changes
    if (nextTurn === playerId) {
        showToast('Your turn now!', 'info');
    }
}

// Handle game over event
function handleGameOver(data) {
    const { winner, players: finalPlayers } = data;
    players = finalPlayers;
    
    // Create modal from template
    const modalTemplate = document.getElementById('game-over-modal-template');
    if (!modalTemplate) {
        showToast('Game Over! Winner: ' + winner.name, 'success');
        return;
    }
    
    const modalElement = document.importNode(modalTemplate.content, true);
    const modal = modalElement.querySelector('.modal-overlay');
    
    // Set winner details
    modal.querySelector('.winner-name').textContent = winner.name;
    modal.querySelector('.winner-score').textContent = winner.score;
    
    // Add player results
    const resultsContainer = modal.querySelector('.player-results');
    players
        .sort((a, b) => b.score - a.score)
        .forEach(player => {
            const playerResult = document.createElement('div');
            playerResult.classList.add('flex', 'justify-between', 'items-center', 'p-2', 'border-b');
            
            // Highlight current player
            if (player.id === playerId) {
                playerResult.classList.add('font-semibold');
            }
            
            playerResult.innerHTML = `
                <span>${player.name}</span>
                <span>${player.score} pairs</span>
            `;
            resultsContainer.appendChild(playerResult);
        });
    
    // Add button handlers
    modal.querySelector('.play-again-btn').addEventListener('click', () => {
        if (isGameCreator) {
            // Only creator can restart
            socket.emit('restartGame', gameId);
            modal.remove();
        } else {
            showToast('Only the game creator can start a new game', 'info');
        }
    });
    
    modal.querySelector('.exit-btn').addEventListener('click', () => {
        modal.remove();
        resetGame();
    });
    
    // Add to document
    document.body.appendChild(modal);
    
    // Show modal with animation
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}

// Update player list display
function updatePlayerList() {
    if (!playersContainerEl) return;
    
    playersContainerEl.innerHTML = '';
    
    players.forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.classList.add('player', 'p-2', 'rounded', 'flex', 'justify-between');
        
        if (player.id === playerId) {
            playerElement.classList.add('bg-blue-100');
        }
        
        // Add current turn indicator
        const currentTurnIndicator = player.id === socket.id ? 
            (isMyTurn ? ' (Your Turn)' : ' (You)') : 
            (player.isTurn ? ' (Current Turn)' : '');
        
        playerElement.innerHTML = `
            <span>${player.name}${currentTurnIndicator}</span>
            <span class="font-semibold">${player.score || 0} pairs</span>
        `;
        
        playersContainerEl.appendChild(playerElement);
    });
}

// Update turn information display
function updateTurnInfo() {
    // Find the current player
    const currentPlayer = players.find(player => player.id === socket.id);
    const currentTurnPlayer = players.find(player => player.isTurn);
    
    // Update turn indicators
    if (currentTurnPlayer) {
        currentPlayerNameEl.textContent = currentTurnPlayer.name;
    }
    
    // Update your turn status
    playerTurnEl.textContent = isMyTurn ? 'Yes' : 'No';
    
    // Update status message
    if (isMyTurn) {
        statusMessageEl.textContent = 'Your turn! Click on a card to flip it.';
    } else if (currentTurnPlayer) {
        statusMessageEl.textContent = `Waiting for ${currentTurnPlayer.name} to make a move.`;
    }
    
    // Update score display
    if (currentPlayer) {
        document.getElementById('player-score').textContent = currentPlayer.score || 0;
    }
}

// Show specific screen and hide others
function showScreen(screenType) {
    // Hide all screens
    gameSetup.classList.add('hidden');
    gameInfo.classList.add('hidden');
    gameBoard.classList.add('hidden');
    playerList.classList.add('hidden');
    waitingRoom.classList.add('hidden');
    gameStatus.classList.add('hidden');
    
    switch (screenType) {
        case 'setup':
            gameSetup.classList.remove('hidden');
            break;
        case 'waiting-room':
            gameInfo.classList.remove('hidden');
            waitingRoom.classList.remove('hidden');
            playerList.classList.remove('hidden');
            break;
        case 'game':
            gameInfo.classList.remove('hidden');
            gameBoard.classList.remove('hidden');
            playerList.classList.remove('hidden');
            gameStatus.classList.remove('hidden');
            if (isGameCreator) {
                gameOptionsEl.classList.add('hidden'); // Hide options during game
            }
            break;
    }
}

// Copy game ID to clipboard for sharing
function copyGameId() {
    if (!gameId) return;
    
    // Use modern clipboard API
    navigator.clipboard.writeText(gameId)
        .then(() => {
            showToast('Game ID copied to clipboard!', 'success');
        })
        .catch(err => {
            console.error('Could not copy text: ', err);
            showToast('Failed to copy. Please select and copy manually.', 'error');
        });
}

// Check game over condition
function checkGameOver() {
    const allMatched = cards.every(card => card.matched);
    if (allMatched) {
        showToast('Game complete! Calculating winner...', 'success');
    }
    return allMatched;
}

// Handle any errors from the server
function handleError(error) {
    console.error('Server error:', error);
    showToast(error.message || 'An error occurred', 'error');
}

// Reset game state
function resetGame() {
    gameId = null;
    cards = [];
    players = [];
    isMyTurn = false;
    matchedPairs = 0;
    totalPairs = 0;
    isGameCreator = false;
    
    // Reset UI
    showScreen('setup');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.classList.add(type);
    
    const id = `toast-${Date.now()}`;
    toast.id = id;
    
    const header = document.createElement('div');
    header.classList.add('toast-header');
    
    const title = document.createElement('div');
    title.classList.add('toast-title');
    title.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    
    const closeBtn = document.createElement('button');
    closeBtn.classList.add('toast-close');
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
        document.getElementById(id).remove();
    });
    
    const body = document.createElement('div');
    body.classList.add('toast-body');
    body.textContent = message;
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    toast.appendChild(header);
    toast.appendChild(body);
    
    toastContainer.appendChild(toast);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
        const toastElement = document.getElementById(id);
        if (toastElement) {
            toastElement.style.animation = 'slideOut 0.5s forwards';
            setTimeout(() => {
                if (document.getElementById(id)) {
                    document.getElementById(id).remove();
                }
            }, 500);
        }
    }, 5000);
}

// Window resize handler for responsive layout
window.addEventListener('resize', () => {
    // Adjust card grid on window resize
    if (cards.length > 0) {
        renderGameBoard();
    }
});
