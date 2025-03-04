const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Game state
const games = {};

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO connection handler
io.on('connection', (socket) => {
console.log('New user connected:', socket.id);

// Get the player name from query parameters
const playerName = socket.handshake.query.name || 'Anonymous';

// Inactive game cleanup
setInterval(() => {
    const now = Date.now();
    Object.keys(games).forEach(gameId => {
        const game = games[gameId];
        // Clean up games inactive for more than 30 minutes
        if (now - game.lastAction > 30 * 60 * 1000) {
            io.to(gameId).emit('gameTimedOut');
            delete games[gameId];
            console.log(`Game ${gameId} deleted due to inactivity`);
        }
    });
}, 5 * 60 * 1000); // Check every 5 minutes

socket.on('createGame', (options = {}) => {
    const gameId = generateGameId();
    games[gameId] = {
        id: gameId,
        players: [{ id: socket.id, name: socket.handshake.query.name || 'Player 1', score: 0 }],
        cards: [],
        currentTurn: socket.id,
        status: 'waiting',
        flippedCards: [],
        lastAction: Date.now(),
        // Nya egenskaper för anpassning
        maxPlayers: options.maxPlayers || 5, // Standard är 5 spelare
        cardTheme: options.cardTheme || 'mixed', // Standard är blandat tema
        cardCount: options.cardCount || 24 // Standard är 24 kort (12 par)
    };

    socket.join(gameId);
    socket.emit('gameCreated', gameId);
    console.log(`Game created: ${gameId} by player ${socket.id} with options:`, 
        { maxPlayers: games[gameId].maxPlayers, cardTheme: games[gameId].cardTheme, cardCount: games[gameId].cardCount });
});

// Join existing game
socket.on('joinGame', (gameId) => {
    const game = games[gameId];
    
    if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
    }
    
    if (game.status !== 'waiting') {
        socket.emit('error', { message: 'Game already in progress' });
        return;
    }
    
    // Check if game is full
    if (game.players.length >= game.maxPlayers) {
        socket.emit('error', { message: `Game is full (max ${game.maxPlayers} players)` });
        return;
    }
    
    // Check if player already exists (reconnecting)
    const existingPlayerIndex = game.players.findIndex(p => p.id === socket.id);
    
    if (existingPlayerIndex === -1) {
        const playerNumber = game.players.length + 1;
        game.players.push({ 
            id: socket.id, 
            name: socket.handshake.query.name || `Player ${playerNumber}`,
            score: 0 
        });
    }
    
    socket.join(gameId);
    socket.emit('gameJoined', { 
        gameId, 
        maxPlayers: game.maxPlayers, 
        cardTheme: game.cardTheme, 
        cardCount: game.cardCount 
    });
    io.to(gameId).emit('playerJoined', { playerId: socket.id, players: game.players });
    console.log(`Player ${socket.id} joined game: ${gameId}`);
});

// Start game
socket.on('startGame', async (gameId) => {
    const game = games[gameId];
    
    if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
    }
    
    if (game.players[0].id !== socket.id) {
        socket.emit('error', { message: 'Only game creator can start the game' });
        return;
    }
    
    game.status = 'playing';
    game.cards = await generateCards(game.cardTheme, game.cardCount);
    
    // Send only necessary card data to clients
    const clientCards = game.cards.map(card => ({
        id: card.id,
        symbol: card.symbol,
        flipped: false,
        matched: false
    }));

    io.to(gameId).emit('gameStarted', { cards: clientCards, currentTurn: game.currentTurn });
    console.log(`Game ${gameId} started with ${game.cardCount} cards and theme: ${game.cardTheme}`);
});

// Handle card selection
socket.on('selectCard', ({ gameId, cardIndex }) => {
    const game = games[gameId];
    
    if (!game || game.status !== 'playing') {
        socket.emit('error', { message: 'Invalid game state' });
        return;
    }
    
    if (game.currentTurn !== socket.id) {
        socket.emit('error', { message: 'Not your turn' });
        return;
    }
    
    // Check if card is already flipped or matched
    if (game.cards[cardIndex].flipped || game.cards[cardIndex].matched) {
        socket.emit('error', { message: 'Card already flipped or matched' });
        return;
    }
    
    // If already two cards flipped, don't allow another selection
    if (game.flippedCards.length >= 2) {
        socket.emit('error', { message: 'Wait for current cards to be processed' });
        return;
    }
    
    // Flip the card
    game.cards[cardIndex].flipped = true;
    game.flippedCards.push(cardIndex);
    game.lastAction = Date.now();
    
    // Broadcast the card selection
    io.to(gameId).emit('cardSelected', { 
        playerId: socket.id, 
        cardIndex,
        symbol: game.cards[cardIndex].symbol,
        cardId: game.cards[cardIndex].id
    });
    
    // If two cards are flipped, check for a match
    if (game.flippedCards.length === 2) {
        const [firstCardIndex, secondCardIndex] = game.flippedCards;
        const firstCard = game.cards[firstCardIndex];
        const secondCard = game.cards[secondCardIndex];
        
        // Check for match
        if (firstCard.symbol === secondCard.symbol) {
            // It's a match
            firstCard.matched = true;
            secondCard.matched = true;
            
            // Update player score
            const playerIndex = game.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                game.players[playerIndex].score += 1;
            }
            
            // Reset flipped cards
            game.flippedCards = [];
            
            // Broadcast match
            io.to(gameId).emit('cardMatch', {
                playerId: socket.id,
                cards: [firstCardIndex, secondCardIndex],
                players: game.players
            });
            
            // Check if game is over
            const allMatched = game.cards.every(card => card.matched);
            if (allMatched) {
                game.status = 'finished';
                io.to(gameId).emit('gameOver', {
                    winner: findWinner(game.players),
                    players: game.players
                });
            }
        } else {
            // Not a match, schedule card flip back
            setTimeout(() => {
                if (games[gameId]) {  // Check if game still exists
                    firstCard.flipped = false;
                    secondCard.flipped = false;
                    game.flippedCards = [];
                    
                    // Move to next player
                    game.currentTurn = getNextPlayer(game);
                    
                    io.to(gameId).emit('cardsMismatch', {
                        cards: [firstCardIndex, secondCardIndex],
                        nextTurn: game.currentTurn
                    });
                }
            }, 1500);
        }
    }
});

// Disconnect handler
socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Clean up games when players disconnect
    for (const gameId in games) {
    const game = games[gameId];
    const playerIndex = game.players.findIndex(player => player.id === socket.id);
    
    if (playerIndex !== -1) {
        game.players.splice(playerIndex, 1);
        
        if (game.players.length === 0) {
        delete games[gameId];
        console.log(`Game ${gameId} ended - all players left`);
        } else {
        io.to(gameId).emit('playerLeft', { playerId: socket.id, players: game.players });
        console.log(`Player ${socket.id} left game: ${gameId}`);
        }
    }
    }
});

// Update game options
socket.on('updateGameOptions', ({ gameId, options }) => {
    const game = games[gameId];
    
    if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
    }
    
    if (game.status !== 'waiting') {
        socket.emit('error', { message: 'Cannot change options after game has started' });
        return;
    }
    
    if (game.players[0].id !== socket.id) {
        socket.emit('error', { message: 'Only game creator can change options' });
        return;
    }
    
    // Update game options
    if (options.maxPlayers) game.maxPlayers = Math.min(Math.max(2, options.maxPlayers), 5); // Between 2 and 5 players
    if (options.cardTheme) game.cardTheme = options.cardTheme;
    if (options.cardCount) game.cardCount = options.cardCount;
    
    // Notify all players in the game about the updated options
    io.to(gameId).emit('gameOptionsUpdated', {
        maxPlayers: game.maxPlayers,
        cardTheme: game.cardTheme,
        cardCount: game.cardCount
    });
    
    console.log(`Game ${gameId} options updated:`, 
        { maxPlayers: game.maxPlayers, cardTheme: game.cardTheme, cardCount: game.cardCount });
});
});

// Helper functions
function generateGameId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getNextPlayer(game) {
    const currentPlayerIndex = game.players.findIndex(player => player.id === game.currentTurn);
    const nextPlayerIndex = (currentPlayerIndex + 1) % game.players.length;
    return game.players[nextPlayerIndex].id;
}

function findWinner(players) {
    if (!players || players.length === 0) return null;
    
    let winner = players[0];
    for (let i = 1; i < players.length; i++) {
        if (players[i].score > winner.score) {
            winner = players[i];
        }
    }
    return winner;
}

function generateCards(theme = 'mixed', count = 24) {
    // This function now supports different themes and card counts
    return new Promise(async (resolve) => {
        const cards = [];
        let categories = [];
        
        // Define available themes
        const themes = {
            'nature': ['nature', 'landscape', 'plants', 'flowers', 'mountains', 'ocean'],
            'animals': ['animals', 'cats', 'dogs', 'wildlife', 'birds', 'insects'],
            'food': ['food', 'fruits', 'vegetables', 'desserts', 'meals', 'drinks'],
            'travel': ['travel', 'cities', 'landmarks', 'beaches', 'architecture', 'sunset'],
            'sports': ['sports', 'football', 'basketball', 'tennis', 'soccer', 'swimming'],
            'technology': ['technology', 'computers', 'gadgets', 'electronics', 'phones', 'devices'],
            'art': ['art', 'painting', 'sculpture', 'design', 'drawing', 'digital-art'],
            'cars': ['cars', 'vehicles', 'racing', 'luxury-cars', 'vintage-cars', 'motorcycles'],
            'space': ['space', 'planets', 'stars', 'galaxy', 'nasa', 'astronomy'],
            'emoji': ['emoji', 'smileys', 'emoticons', 'faces', 'symbols', 'gestures']
        };
        
        // Set categories based on selected theme
        if (theme === 'mixed') {
            // Use all categories for mixed theme
            categories = Object.values(themes).flat();
        } else if (themes[theme]) {
            categories = themes[theme];
        } else {
            // Fallback to mixed if theme not found
            categories = Object.values(themes).flat();
        }
        
        // Ensure count is even (for pairs)
        const pairCount = Math.floor(count / 2);
        const imageIds = [];
        
        // Generate unique image IDs for the pairs
        for (let i = 0; i < pairCount; i++) {
            // Generate a unique ID for each image
            const id = Math.floor(Math.random() * 1000).toString();
            imageIds.push(id);
        }
        
        // Create pairs
        imageIds.forEach((id, index) => {
            const category = categories[index % categories.length];
            const imageUrl = `https://source.unsplash.com/150x150/?${category}&sig=${id}`;
            cards.push({ id: id + 'a', symbol: imageUrl, flipped: false, matched: false });
            cards.push({ id: id + 'b', symbol: imageUrl, flipped: false, matched: false });
        });
        
        // Shuffle
        resolve(shuffleArray(cards));
    });
}

function shuffleArray(array) {
const newArray = [...array];
for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
}
return newArray;
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});

