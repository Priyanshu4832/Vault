const API = '/api';
const token = localStorage.getItem('token');

let allNotes = [];
let currentFiles = [];
let currentViewNoteId = null;
let viewNewFiles = [];


// DOM elements
const notesGrid         = document.getElementById('notes-grid');
const emptyState        = document.getElementById('empty-state');
const navUsername       = document.getElementById('nav-username');
const logoutBtn         = document.getElementById('btn-logout');
const searchInput       = document.getElementById('search-input');

const createTrigger     = document.getElementById('create-trigger');
const createModal       = document.getElementById('create-modal-overlay');
const createCloseBtn    = document.getElementById('create-modal-close');
const createContent     = document.getElementById('create-content');
const createFileInput   = document.getElementById('create-file-input');
const createFilesList   = document.getElementById('create-files-list');
const createSaveBtn     = document.getElementById('create-save-btn');
const createPreview     = document.getElementById('create-preview');

const viewModal         = document.getElementById('view-modal-overlay');
const viewCloseBtn      = document.getElementById('view-modal-close');
const viewContent       = document.getElementById('view-content');
const viewSaveBtn       = document.getElementById('view-save-btn');
const viewDeleteBtn     = document.getElementById('view-delete-btn');
const viewShareBtn      = document.getElementById('view-share-btn');
const viewFileInput     = document.getElementById('view-file-input');
const viewFilesList     = document.getElementById('view-files-list');
const shareUrlRow       = document.getElementById('share-url-row');
const shareUrlInput     = document.getElementById('share-url-input');
const copyShareBtn      = document.getElementById('copy-share-btn');


// ─── INIT ────────────────────────────────────────────────────────────────────

async function init() {
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
            return;
        }

        const data = await response.json();
        navUsername.textContent = data.user.name;

        await fetchAndRenderNotes();

    } catch (err) {
        console.error('Init error:', err);
        alert('Could not connect to the server. Please try again later.');
    }
}


// ─── FETCH & RENDER NOTES ────────────────────────────────────────────────────

async function fetchAndRenderNotes() {
    try {
        const response = await fetch(`${API}/notes`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch notes');

        const data = await response.json();
        allNotes = data.notes;
        renderNotesGrid(allNotes);

    } catch (err) {
        console.error('Fetch notes error:', err);
    }
}

async function renderNotesGrid(notes) {
    notesGrid.innerHTML = '';

    if (notes.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    notes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.setAttribute('data-id', note.id);

        let filesHTML = '';
        if (note.files && note.files.length > 0) {
            filesHTML += `<div class="note-card-files">`;
            note.files.forEach(file => {
                if (file.fileType.startsWith('image/')) {
                    filesHTML += `<img src="${file.fileUrl}" style="width:100%;border-radius:8px;object-fit:cover;" />`;
                } else {
                    filesHTML += `<span class="file-chip">📄 ${file.fileName}</span>`;
                }
            });
            filesHTML += `</div>`;
        }

        let previewHTML = '';
        const urlMatch = note.content.match(/(https?:\/\/[^\s]+)/g);
        if (urlMatch) {
            previewHTML = `
                <div id="preview-placeholder-${note.id}" style="margin-top:10px;">
                    <span style="font-size:0.75rem;color:var(--ink-light);">⏳ Loading preview...</span>
                </div>`;
            loadCardPreview(note.id, urlMatch[0]);
        }

        card.innerHTML = `
            <p class="note-card-content">${note.content}</p>
            ${previewHTML}
            ${filesHTML}
            <hr class="note-card-separator" />
            <div class="note-card-actions">
                <button class="btn-icon danger delete-btn" data-id="${note.id}">🗑️</button>
                <button class="btn-icon share-btn" data-id="${note.id}">🔗</button>
            </div>
        `;

        notesGrid.appendChild(card);
    });
}


// ─── LINK PREVIEW ON CARDS ───────────────────────────────────────────────────

async function loadCardPreview(noteId, targetUrl) {
    try {
        const response = await fetch(`${API}/notes/preview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ url: targetUrl })
        });

        const placeholder = document.getElementById(`preview-placeholder-${noteId}`);
        if (!response.ok || !placeholder) {
            if (placeholder) placeholder.style.display = 'none';
            return;
        }

        const data = await response.json();
        placeholder.innerHTML = `
            <div class="modal-preview" style="cursor:pointer;" onclick="window.open('${targetUrl}','_blank')">
                <img class="preview-img" src="${data.preview.image}" alt="" onerror="this.style.display='none'" />
                <div class="preview-text">
                    <p class="preview-title">${data.preview.title}</p>
                    <p class="preview-desc">${data.preview.description}</p>
                </div>
            </div>`;

    } catch (err) {
        const placeholder = document.getElementById(`preview-placeholder-${noteId}`);
        if (placeholder) placeholder.style.display = 'none';
    }
}


// ─── CREATE NOTE ─────────────────────────────────────────────────────────────

async function saveNote() {
    const contentText = createContent.value.trim();
    if (!contentText) {
        alert('Note cannot be empty.');
        return;
    }

    createSaveBtn.textContent = 'Saving...';
    createSaveBtn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('content', contentText);
        currentFiles.forEach(file => formData.append('files', file));

        const response = await fetch(`${API}/notes`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });

        if (!response.ok) throw new Error('Failed to save note');

        createModal.classList.add('hidden');
        createContent.value = '';
        currentFiles = [];
        createFilesList.innerHTML = '';
        createPreview.classList.add('hidden');

        await fetchAndRenderNotes();

    } catch (err) {
        console.error('Save error:', err);
        alert('Could not save note.');
    } finally {
        createSaveBtn.textContent = 'Save note';
        createSaveBtn.disabled = false;
    }
}


// ─── LINK PREVIEW IN CREATE MODAL ────────────────────────────────────────────

let typingTimer;
createContent.addEventListener('input', () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(async () => {
        const text = createContent.value;
        const urlMatch = text.match(/(https?:\/\/[^\s]+)/g);

        if (!urlMatch) {
            createPreview.classList.add('hidden');
            return;
        }

        try {
            const response = await fetch(`${API}/notes/preview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ url: urlMatch[0] })
            });

            if (response.ok) {
                const data = await response.json();
                document.getElementById('create-preview-img').src = data.preview.image;
                document.getElementById('create-preview-title').textContent = data.preview.title;
                document.getElementById('create-preview-desc').textContent = data.preview.description;
                createPreview.classList.remove('hidden');
            }
        } catch (err) {
            createPreview.classList.add('hidden');
        }
    }, 1000);
});


// ─── FILE PICKER — CREATE MODAL ──────────────────────────────────────────────

createFileInput.addEventListener('change', (event) => {
    const files = Array.from(event.target.files);
    currentFiles = currentFiles.concat(files);
    renderCreateFileChips();
});

function renderCreateFileChips() {
    createFilesList.innerHTML = '';
    currentFiles.forEach((file, index) => {
        const chip = document.createElement('div');
        chip.className = 'modal-file-chip';
        chip.innerHTML = `
            ${file.type.startsWith('image/') ? '📸' : '📄'} ${file.name}
            <button type="button" onclick="removeCreateFile(${index})">✕</button>`;
        createFilesList.appendChild(chip);
    });
}

window.removeCreateFile = function (index) {
    currentFiles.splice(index, 1);
    renderCreateFileChips();
};


// ─── OPEN VIEW MODAL ─────────────────────────────────────────────────────────

function openViewModal(noteId) {
    const noteData = allNotes.find(n => n.id === noteId);
    if (!noteData) return;

    currentViewNoteId = noteId;
    viewNewFiles = [];

    viewContent.value = noteData.content;
    viewSaveBtn.setAttribute('data-id', noteId);
    viewDeleteBtn.setAttribute('data-id', noteId);

    viewFilesList.innerHTML = '';
    if (noteData.files && noteData.files.length > 0) {
        noteData.files.forEach(file => {
            const wrapper = document.createElement('div');
            wrapper.style.marginBottom = '8px';

            if(file.fileType.startsWith('image/')) {
                // images — show preview + download link
                wrapper.innerHTML = `
                    <img src="${file.fileUrl}" style="width:100%;border-radius:8px;object-fit:cover;margin-bottom:6px;" />
                    <div class="modal-file-chip">
                        <a href="${file.fileUrl}" target="_blank" download="${file.fileName}" style="color:var(--accent);text-decoration:none;">
                            📸 Download ${file.fileName}
                        </a>
                        <button type="button" onclick="deleteExistingFile(${noteData.id}, ${file.id})">✕</button>
                    </div>`;
            } else {
                // pdfs and other files — just download link
                wrapper.innerHTML = `
                    <div class="modal-file-chip">
                        <a href="${file.fileUrl}" target="_blank" download="${file.fileName}" style="color:var(--accent);text-decoration:none;">
                            📄 Download ${file.fileName}
                        </a>
                        <button type="button" onclick="deleteExistingFile(${noteData.id}, ${file.id})">✕</button>
                    </div>`;
            }

            viewFilesList.appendChild(wrapper);
        });
        
    }

    shareUrlRow.classList.add('hidden');
    shareUrlInput.value = '';
    viewModal.classList.remove('hidden');
}


// ─── UPDATE NOTE ─────────────────────────────────────────────────────────────

async function updateNote() {
    const noteId = viewSaveBtn.getAttribute('data-id');
    const updatedText = viewContent.value.trim();

    if (!updatedText) {
        alert('Note cannot be empty.');
        return;
    }

    viewSaveBtn.textContent = 'Saving...';
    viewSaveBtn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('content', updatedText);
        viewNewFiles.forEach(file => formData.append('files', file));

        const response = await fetch(`${API}/notes/${noteId}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });

        if (!response.ok) throw new Error('Failed to update note');

        viewModal.classList.add('hidden');
        await fetchAndRenderNotes();

    } catch (err) {
        console.error('Update error:', err);
        alert('Could not save changes.');
    } finally {
        viewSaveBtn.textContent = 'Save changes';
        viewSaveBtn.disabled = false;
    }
}


// ─── DELETE NOTE (FROM VIEW MODAL) ───────────────────────────────────────────

async function deleteNoteFromModal() {
    const noteId = viewDeleteBtn.getAttribute('data-id');
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
        const response = await fetch(`${API}/notes/${noteId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to delete note');

        viewModal.classList.add('hidden');
        await fetchAndRenderNotes();

    } catch (err) {
        console.error('Delete error:', err);
        alert('Could not delete note.');
    }
}


// ─── DELETE SINGLE FILE FROM NOTE ────────────────────────────────────────────

window.deleteExistingFile = async function (noteId, fileId) {
    if (!confirm('Remove this file from the note?')) return;

    try {
        const response = await fetch(`${API}/notes/${noteId}/files/${fileId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to delete file');

        // update allNotes locally so modal refreshes without full fetch
        const note = allNotes.find(n => n.id === noteId);
        if (note) note.files = note.files.filter(f => f.id !== fileId);

        openViewModal(noteId);

    } catch (err) {
        console.error('File delete error:', err);
        alert('Could not remove file.');
    }
};


// ─── ADD FILES IN VIEW MODAL ─────────────────────────────────────────────────

viewFileInput.addEventListener('change', (event) => {
    const files = Array.from(event.target.files);
    viewNewFiles = viewNewFiles.concat(files);

    files.forEach(file => {
        const chip = document.createElement('div');
        chip.className = 'modal-file-chip';
        chip.innerHTML = `<span>${file.type.startsWith('image/') ? '📸' : '📄'} ${file.name} (new)</span>`;
        viewFilesList.appendChild(chip);
    });
});


// ─── SHARE NOTE ──────────────────────────────────────────────────────────────

async function shareNote(noteId) {
    try {
        const response = await fetch(`${API}/notes/${noteId}/share`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to generate share link');

        const data = await response.json();
        const publicUrl = `${window.location.origin}/share.html?token=${data.token}`;

        shareUrlInput.value = publicUrl;
        shareUrlRow.classList.remove('hidden');

    } catch (err) {
        console.error('Share error:', err);
        alert('Could not generate share link.');
    }
}


// ─── COPY SHARE URL ──────────────────────────────────────────────────────────

copyShareBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(shareUrlInput.value).then(() => {
        copyShareBtn.textContent = 'Copied!';
        setTimeout(() => { copyShareBtn.textContent = 'Copy'; }, 2000);
    });
});


// ─── SEARCH ──────────────────────────────────────────────────────────────────

let searchTimer;
searchInput.addEventListener('input', (event) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        const query = event.target.value.toLowerCase().trim();
        const filtered = allNotes.filter(note =>
            note.content.toLowerCase().includes(query)
        );
        renderNotesGrid(filtered);
    }, 300);
});


// ─── GRID EVENT DELEGATION ───────────────────────────────────────────────────

notesGrid.addEventListener('click', async (event) => {

    // delete button on card
    if (event.target.classList.contains('delete-btn')) {
        const noteId = parseInt(event.target.getAttribute('data-id'));
        if (!confirm('Delete this note?')) return;
        try {
            const response = await fetch(`${API}/notes/${noteId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) await fetchAndRenderNotes();
        } catch (err) {
            console.error('Delete error:', err);
        }
        return;
    }

    // share button on card
    if (event.target.classList.contains('share-btn')) {
        const noteId = parseInt(event.target.getAttribute('data-id'));
        openViewModal(noteId);
        await shareNote(noteId);
        return;
    }

    // clicking card body opens view modal
    const card = event.target.closest('.note-card');
    if (card) {
        const noteId = parseInt(card.getAttribute('data-id'));
        openViewModal(noteId);
    }
});


// ─── SIMPLE BUTTON LISTENERS ─────────────────────────────────────────────────

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});

createTrigger.addEventListener('click', () => {
    createModal.classList.remove('hidden');
});

createCloseBtn.addEventListener('click', () => {
    createModal.classList.add('hidden');
    createContent.value = '';
    currentFiles = [];
    createFilesList.innerHTML = '';
    createPreview.classList.add('hidden');
});

createSaveBtn.addEventListener('click', saveNote);

viewCloseBtn.addEventListener('click', () => {
    viewModal.classList.add('hidden');
    shareUrlRow.classList.add('hidden');
    viewNewFiles = [];
});

viewSaveBtn.addEventListener('click', updateNote);
viewDeleteBtn.addEventListener('click', deleteNoteFromModal);
viewShareBtn.addEventListener('click', () => shareNote(currentViewNoteId));


// ─── START ───────────────────────────────────────────────────────────────────

init();