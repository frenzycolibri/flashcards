'use strict';

const LISTS_KEY = 'flashcards.lists';
const SETTINGS_KEY = 'flashcards.settings';

const elements = {
    home: document.getElementById('home'),
    session: document.getElementById('session'),
    shuffle: document.getElementById('shuffle'),
    directions: document.querySelectorAll('input[name="direction"]'),
    lists: document.getElementById('lists'),
    empty: document.getElementById('empty'),
    import: document.getElementById('import'),
    importButton: document.getElementById('import-button'),
    practice: document.getElementById('practice'),
    back: document.getElementById('back'),
    sessionTitle: document.getElementById('session-title'),
    status: document.getElementById('status'),
    progress: document.getElementById('progress'),
    card: document.getElementById('card'),
    prev: document.getElementById('prev'),
    next: document.getElementById('next'),
};

let lists = loadLists();
let settings = loadSettings();
const selected = new Set();
let deck = [];
let position = 0;
let flipped = false;

function loadLists() {
    return JSON.parse(localStorage.getItem(LISTS_KEY) ?? '[]');
}

function saveLists() {
    if (lists.length === 0) {
        localStorage.clear();
        saveSettings();
        return;
    }
    localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
}

function loadSettings() {
    return {shuffle: false, direction: 'standard', ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}')};
}

function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (quoted) {
            if (char === '"' && text[i + 1] === '"') {
                field += '"';
                i++;
            } else if (char === '"') {
                quoted = false;
            } else {
                field += char;
            }
        } else if (char === '"') {
            quoted = true;
        } else if (char === ',') {
            row.push(field);
            field = '';
        } else if (char === '\n' || char === '\r') {
            if (char === '\r' && text[i + 1] === '\n') {
                i++;
            }
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else {
            field += char;
        }
    }
    row.push(field);
    rows.push(row);

    const cards = [];
    for (const [question, answer] of rows) {
        if (question?.trim() && answer?.trim()) {
            cards.push({question: question.trim(), answer: answer.trim()});
        }
    }
    return cards;
}

function renderSettings() {
    elements.shuffle.checked = settings.shuffle;
    for (const radio of elements.directions) {
        radio.checked = radio.value === settings.direction;
    }
}

function renderLists() {
    elements.lists.replaceChildren();
    for (const list of lists) {
        const item = document.createElement('li');

        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = selected.has(list.id);
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                selected.add(list.id);
            } else {
                selected.delete(list.id);
            }
            renderPracticeButton();
        });
        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = list.name;
        const count = document.createElement('span');
        count.className = 'muted';
        count.textContent = `${list.cards.length} cards`;
        label.append(checkbox, name, count);

        const remove = document.createElement('button');
        remove.className = 'danger';
        remove.textContent = 'Delete';
        remove.setAttribute('aria-label', `Delete ${list.name}`);
        remove.addEventListener('click', () => {
            if (!confirm(`Delete "${list.name}"?`)) {
                return;
            }
            lists = lists.filter((other) => other.id !== list.id);
            selected.delete(list.id);
            saveLists();
            renderLists();
            announce(`Deleted "${list.name}"`);
            elements.importButton.focus();
        });

        item.append(label, remove);
        elements.lists.append(item);
    }
    elements.empty.hidden = lists.length > 0;
    renderPracticeButton();
}

function renderPracticeButton() {
    elements.practice.disabled = selected.size === 0;
}

function announce(message) {
    elements.status.textContent = message;
}

function shuffled(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function isReversed() {
    if (settings.direction === 'mixed') {
        return Math.random() < 0.5;
    }
    return settings.direction === 'reverse';
}

function startPractice() {
    const cards = [];
    for (const list of lists) {
        if (selected.has(list.id)) {
            cards.push(...list.cards);
        }
    }
    deck = [];
    for (const card of settings.shuffle ? shuffled(cards) : cards) {
        deck.push({...card, reversed: isReversed()});
    }
    position = 0;
    flipped = false;
    elements.home.hidden = true;
    elements.session.hidden = false;
    elements.sessionTitle.focus();
    renderCard();
}

function renderCard() {
    const card = deck[position];
    const showsAnswer = flipped !== card.reversed;
    const side = document.createElement('span');
    side.className = 'side';
    side.textContent = showsAnswer ? 'Answer' : 'Question';
    const text = document.createElement('span');
    text.textContent = showsAnswer ? card.answer : card.question;
    elements.card.replaceChildren(side, text);
    elements.card.classList.toggle('flipped', flipped);
    elements.progress.textContent = `${position + 1} / ${deck.length}`;
    elements.prev.disabled = position === 0;
    elements.next.disabled = position === deck.length - 1;
    announce(`Card ${position + 1} of ${deck.length}. ${side.textContent}: ${text.textContent}`);
}

function goHome() {
    elements.session.hidden = true;
    elements.home.hidden = false;
    elements.practice.focus();
}

function move(offset) {
    position += offset;
    flipped = false;
    renderCard();
}

elements.shuffle.addEventListener('change', () => {
    settings.shuffle = elements.shuffle.checked;
    saveSettings();
});

for (const radio of elements.directions) {
    radio.addEventListener('change', () => {
        settings.direction = radio.value;
        saveSettings();
    });
}

elements.import.addEventListener('change', async () => {
    const file = elements.import.files[0];
    elements.import.value = '';
    const cards = parseCsv(await file.text());
    if (cards.length === 0) {
        alert('No cards found. The CSV must have two columns: question, answer.');
        return;
    }
    const name = file.name.replace(/\.csv$/i, '');
    lists.push({id: crypto.randomUUID(), name, cards});
    saveLists();
    renderLists();
    announce(`Imported "${name}", ${cards.length} cards`);
});

elements.importButton.addEventListener('click', () => elements.import.click());

elements.practice.addEventListener('click', startPractice);
elements.card.addEventListener('click', () => {
    flipped = !flipped;
    renderCard();
});
elements.prev.addEventListener('click', () => move(-1));
elements.next.addEventListener('click', () => move(1));
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement && event.target.type === 'checkbox') {
        event.target.click();
        return;
    }
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement && event.target.name === 'direction') {
        const radios = [...elements.directions];
        const nextRadio = radios[(radios.indexOf(event.target) + 1) % radios.length];
        nextRadio.click();
        nextRadio.focus();
        return;
    }
    if (elements.session.hidden) {
        return;
    }
    if (event.key === 'ArrowLeft' && !elements.prev.disabled) {
        move(-1);
    } else if (event.key === 'ArrowRight' && !elements.next.disabled) {
        move(1);
    } else if (event.key === 'Escape') {
        goHome();
    }
});
elements.back.addEventListener('click', goHome);

renderSettings();
renderLists();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}
