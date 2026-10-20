# Flashcards

A small flashcard Progressive Web App (PWA) made with plain HTML, CSS and JavaScript. It has no dependencies and no build step. It works offline and can be installed to the home screen or desktop.

## Features

- **Import lists from CSV**: each file becomes a list named after the file.
- **Manage lists**: lists are shown one under another, and each can be deleted on its own. Deleting the last list clears local storage.
- **Practice several lists at once**: tick the lists you want and press **Practice**.
- **Practice settings** (saved in local storage):
  - **Shuffle**: randomises the card order.
  - **Direction**:
    - **Standard** shows the question first.
    - **Reverse** shows the answer first.
    - **Mixed** picks the direction at random for each card.
- **Flip cards**: click or tap a card to switch between its two sides.
- **Keyboard shortcuts** during practice:

  | Key | Action |
  |-----|--------|
  | ← | Previous card |
  | → | Next card |
  | Esc | Back to the main menu |

## CSV format

Two columns, `question` and `answer`, with no header row:

```csv
cat,kaķis
dog,suns
"hello, world","sveika, pasaule"
"say ""hi""",saki „sveiks”
```

- Quote a field if it contains commas, quotes or line breaks. Inside a quoted field, write a quote as two quotes (`""`).
- Rows are skipped if the question or the answer is empty.
- A header row is not skipped, so it would be imported as a card.

## Running locally

The offline mode needs the app to be served over HTTP. It does not work when `index.html` is opened directly as a file.

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deployment

Upload the files to any static web host. Browsers only allow offline mode and installing the app over HTTPS, apart from `localhost`.

After changing any file, update the `CACHE` version in `sw.js` (for example `flashcards-v8` → `flashcards-v9`). Until you do, people who have used the app before will keep seeing the old saved copy.

## Project structure

| File | Purpose |
|------|---------|
| `index.html` | The main menu and practice screens |
| `app.js` | Storage, CSV import, settings and practice logic |
| `style.css` | Styling (dark beige and green theme) |
| `sw.js` | Service worker that saves the app's files for offline use |
| `manifest.json` | PWA manifest (name, colours, icon) |
| `icon.svg` | App icon |

## Data storage

Everything is kept in the browser's `localStorage`:

- `flashcards.lists`: the imported lists and their cards.
- `flashcards.settings`: the Shuffle and Direction settings.

Nothing leaves the device.
