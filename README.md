# Memory Game

## Översikt
Detta är ett multiplayer memory-spel där användare kan skapa spelrum och bjuda in upp till 5 andra spelare. Spelet använder gratis bild-API:er för att generera olika och intressanta kortuppsättningar för varje spel.

## Funktioner
- Skapa nya memory-spel sessioner
- Anslut till befintliga spel med en unik spelkod
- Realtids-multiplayer med Socket.IO
- Stöd för upp till 5 spelare
- Anpassningsalternativ för spelkortsantal och tema
- Varierade kortuppsättningar från gratis bild-API:er
- Responsiv design för både desktop och mobil
- Poängräkning och vinnartavla

## Nytillagda funktioner
- **Stöd för flera spelare**: Utökat från 2 till upp till 5 spelare
- **Anpassningsbara spelkort**: Möjlighet att välja mellan olika teman:
  - Natur
  - Djur
  - Mat
  - Resor
  - Sport
  - Teknik
  - Konst
  - Bilar
  - Rymden
  - Emoji
- **Flexibelt antal kort**: Välj mellan 8, 12, 16, 24, 36 eller 48 kort
- **Förbättrad UI/UX**: Snyggare design med responsivt gränssnitt
- **Visuell återkoppling**: Ljud- och visuella effekter för kortmatchningar
- **Spelvärd-kontroller**: Möjlighet för spelledaren att ändra inställningar
- **Detaljerad spelstatistik**: Visar poängställning i realtid

## Teknologier
- **Backend**: Node.js, Express.js
- **Realtidskommunikation**: Socket.IO
- **Frontend**: HTML5, CSS3, JavaScript
- **Styling**: CSS och TailwindCSS
- **Bildkällor**: Gratis publika API:er för bilder

## Installation och konfiguration
```bash
# Klona repot
git clone https://github.com/DIN-ANVÄNDARNAMN/mem.git

# Navigera till projektmappen
cd mem

# Installera beroenden
npm install

# Starta utvecklingsservern
npm run dev

# ELLER starta produktionsservern
npm start
```

### Förutsättningar
- Node.js (v14 eller senare)
- npm (v6 eller senare)

### Konfiguration
Ingen ytterligare konfiguration krävs för att köra spelet lokalt. Applikationen använder automatiskt gratis publika API:er för bildkorten.

## Hur man spelar

### Spelkonfiguration
1. Skapa ett nytt spel genom att klicka på "Create Game" på startsidan
2. Välj max antal spelare (2-5), bildtema och antal kort
3. Dela den genererade spelkoden med vänner som vill ansluta
4. Andra spelare kan ansluta med denna kod från "Join Game"-sektionen
5. Spelet börjar när värden startar spelet

### Spelande
1. Spelare turas om i den ordning de gick med i spelet
2. På din tur, vänd två kort genom att klicka på dem
3. Om korten matchar behåller du dem och får 1 poäng
4. Om de inte matchar vänds de tillbaka och din tur avslutas
5. Spelet fortsätter tills alla par har hittats
6. Spelaren med flest par i slutet vinner

## Framtida utveckling
- Ytterligare spellägen
- Anpassningsbara kortteman
- Användar-konton och permanent statistik
- Globala topplistor

## Bidrag
Bidrag välkomnas! Skicka gärna in en Pull Request.

## Licens
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
