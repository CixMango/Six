# Changelog

What changed in each release of the Six app. Downloads are on the [Releases](https://github.com/CixMango/Six/releases) page.

## 1.3.3

- **Feedback button** at the top right (left of Settings): send bugs, ideas or anything else straight to the developer, with an optional way to reach you.

## 1.3.2

- **Analysis board:** the Board panel no longer cuts off its right edge (the Erase button, stone count and Load button).

## 1.3.1

- **Loading screen:** opening Six shows a loading page in your browser straight away, which switches to Six as soon as it's ready (no more wondering whether anything happened).
- **Analysis board:**
  - **Undo and redo:** buttons, plus Ctrl+Z and Ctrl+Y (or Ctrl+Shift+Z).
  - **Analyze Blue / Analyze Yellow** buttons in the Board panel ask Six for the best turn for that colour.
  - The import box takes any game (HeXO link, HTTTX, replay file) as well as HeXO positions.
- **Coach review:** the follow-up line's stones are numbered by turn (1 is the next turn, then 2, 3 and so on).
- **Camera:** hold the right or middle mouse button to pan.
- **Levels:** round numbers of positions per turn: 6k, 12k, 30k, 65k, 135k, 250k and 500k.
- **Settings:** Six's generation moved here, and the blunder sound has one volume slider.
- **Home screen:** simpler: "Play a friend" and "Friend vs bot" are gone, and "Watch bots play" is now "Bot vs Bot".

## 1.3.0

- **Installers:** a setup wizard for Windows, an installer for macOS, and a .deb for Linux, with the portable zips still available.
- **No window:** Six opens in your browser with nothing else on screen. Quit it from Settings; it also stops by itself a few minutes after the last tab closes.
- **Updates:** each time Six starts it checks for a new version and offers to update, keeping your saved games. Coming from 1.2.1 or older, your saved games and sound levels are brought over once.
- **Six thinks by positions:** each level looks at a fixed number of positions per turn, so Six plays at the same strength on any computer (slower ones take longer). A meter shows positions per second while it thinks. Settings can switch back to thinking by time.
- **Levels 6 and 7** search much longer in the app (a bigger search tree); the website offers levels 1 to 5.
- **Analysis board:** free placement (X, O, erase), choose who moves, paste HeXO sandbox positions, and ask Six for the best turn for either side.
- **Camera stays put** when you place a stone near the edge ("Auto camera" in Settings brings back the old behaviour).
- **Desktop shortcut** button in Settings.

## 1.2.1

- **Linux:** Six works without graphics drivers (falls back to the CPU), and runs on older distributions (Ubuntu 22.04, Debian 12, Linux Mint 21).
- If the bot's engine stops, the app says why right away.

## 1.2.0

- **Mac download** (Apple Silicon): the bot runs on the GPU through Metal.
- **Linux:** the bot runs on AMD and Intel graphics cards too (through Vulkan).
- **Older generations:** every 10th generation of Six can be picked and downloads the first time you play it.
- Coach review fixes.

## 1.1.0

- Import games from a HeXO link, HTTTX notation or a replay file; export any game as HTTTX or a replay file.
- Radius 8 only.
- Coach review fixes and polish.
- Linux download.

## 1.0.1

- Radius 8 only: every game is played at radius 8.

## 1.0.0

- First release (Windows): Six with network generation 455 on any DirectX 12 GPU, up to 45 s of thinking per turn, game review with the coach, HeXO import, analysis board, replays, and games with friends over LAN or Hamachi.
