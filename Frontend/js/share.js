const API = 'http://localhost:5000/api';

const params = new URLSearchParams(window.location.search);
const shareToken = params.get('token');


const loadingDiv = document.getElementById('shared-loading');
const errorDiv = document.getElementById('shared-error');
const noteCard = document.getElementById('shared-note');
const noteContent = document.getElementById('shared-note-content');
const noteCardFiles = document.getElementById('shared-files');
const noteSeparator = document.getElementById('shared-separator');
const noteTimestamp = document.getElementById('shared-timestamp');

async function fetchSharedNote() {
    if (!shareToken) {
        loadingDiv.classList.add('hidden');
        errorDiv.classList.remove('hidden');
        return;
    }

    try {
        const response = await fetch(`${API}/notes/shared/${shareToken}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        loadingDiv.classList.add('hidden');

        if (!response.ok) {
            errorDiv.classList.remove('hidden');
            return;
        }

        const data = await response.json();
        const note = data.note;

        
        noteContent.textContent = note.content;

        const urlMatch = note.content.match(/(https?:\/\/[^\s]+)/g);
        if (urlMatch) {
            const previewHTML = `
                <div id="shared-preview-placeholder" style="margin-top: 16px;">
                    <span style="font-size: 0.85rem; color: gray;">⏳ Loading preview...</span>
                </div>
            `;
            noteContent.insertAdjacentHTML('beforeend', previewHTML);
            loadPublicCardPreview(urlMatch[0]);
        }

        if (note.files && note.files.length > 0) {
            noteSeparator.classList.remove('hidden'); // Reveal the dashed line
            
            note.files.forEach(file => {
                if (file.fileType.startsWith('image/')) {
                    noteCardFiles.innerHTML += `<img src="${file.fileUrl}" style="width:100%; border-radius:8px; object-fit:contain; margin-bottom: 8px;" />`;
                } else {
                   
                    noteCardFiles.innerHTML += `<a href="${file.fileUrl}" target="_blank" download="${file.fileName}" class="shared-file-chip">
                                                📄 ${file.fileName}
                                                </a>`;
                }
            });
        }

       
        const dateObj = new Date(note.updatedAt);
        noteTimestamp.textContent = `Last updated: ${dateObj.toLocaleDateString()} at ${dateObj.toLocaleTimeString()}`;

        
        noteCard.classList.remove('hidden');

    } catch (err) {
        console.error("Note could not be fetched", err);
        loadingDiv.classList.add('hidden');
        errorDiv.classList.remove('hidden');
    }
}

async function loadPublicCardPreview(targetUrl) {
    try {
        const response = await fetch(`${API}/notes/preview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: targetUrl })
        });

        const placeholder = document.getElementById('shared-preview-placeholder');
        
        if (!response.ok || !placeholder) {
            if (placeholder) placeholder.style.display = 'none';
            return;
        }

        const data = await response.json();
        
        placeholder.innerHTML = `
            <div class="modal-preview" style="cursor:pointer; border: 1px solid #eee; border-radius: 8px; overflow: hidden; margin-top: 12px;" onclick="window.open('${targetUrl}','_blank')">
                <img class="preview-img" src="${data.preview.image}" alt="" onerror="this.style.display='none'" style="width: 100%; height: 150px; object-fit: contain;" />
                <div class="preview-text" style="padding: 12px; background: #fafafa;">
                    <p class="preview-title" style="margin: 0 0 4px 0; font-weight: bold; color: #111;">${data.preview.title}</p>
                    <p class="preview-desc" style="margin: 0; font-size: 0.9em; color: #555;">${data.preview.description}</p>
                </div>
            </div>`;

    } catch (err) {
        const placeholder = document.getElementById('shared-preview-placeholder');
        if (placeholder) placeholder.style.display = 'none';
    }
}


fetchSharedNote();