# Memory Game

## Overview
This is a multiplayer memory game web application where users can create games and invite others to join. The game uses free image APIs to generate diverse and interesting card sets for each game.

## Features
- Create new memory game sessions
- Join existing games using a unique game code
- Real-time multiplayer gameplay using Socket.IO
- Diverse card sets pulled from free image APIs
- Responsive design for both desktop and mobile play
- Score tracking and leaderboards

## Technologies Used
- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.IO
- **Frontend**: HTML5, CSS3, JavaScript
- **Styling**: TailwindCSS
- **Image Sources**: Free public APIs for images, symbols, icons, and emojis

## Setup and Installation
```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/mem.git

# Navigate to the project directory
cd mem

# Install dependencies
npm install

# Start the development server
npm run start
```

### Prerequisites
- Node.js (v14 or later)
- npm (v6 or later)

### Configuration
No additional configuration is required to run the game locally. The application will automatically use free public APIs for the card images.

## How to Play

### Game Setup
1. Create a new game by clicking "Create Game" on the homepage
2. Share the generated game code with friends who want to join
3. Other players can join using this code from the "Join Game" section
4. The game begins when all players are ready or the host starts the game

### Gameplay
1. Players take turns in the order they joined the game
2. On your turn, flip two cards by clicking on them
3. If the cards match, you keep them and earn 1 point
4. If they don't match, they flip back over and your turn ends
5. The game continues until all pairs have been found
6. The player with the most pairs at the end wins

### Controls
- Click on cards to flip them
- Use the chat feature to communicate with other players
- View the scoreboard to track everyone's progress

## Image APIs
The game utilizes several free image APIs to provide diverse card content:
- Icon/symbol libraries
- Public domain image collections
- Emoji APIs
- And more!

## Future Development
- Additional game modes
- Customizable card themes
- User accounts and persistent statistics
- Global leaderboards

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
MIT License

Copyright (c) 2023

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Contact
For questions or suggestions, please open an issue on GitHub.
