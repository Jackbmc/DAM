// renderer.js
const { ipcRenderer, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const importBtn = document.getElementById('importBtn');
const deleteBtn = document.getElementById('deleteBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const locationBtn = document.getElementById('locationBtn');
const libraryContainer = document.getElementById('libraryContainer');
const searchInput = document.getElementById('searchInput');

const deletedItems = [];
const redoItems = [];

let library = {};
let searchTimeout = null;

importBtn.addEventListener('click', () => {
    ipcRenderer.send('import-files');
});

deleteBtn.addEventListener('click', () => {
    const selectedItems = libraryContainer.querySelectorAll('.selected');
    const confirmDelete = confirm(`Are you sure you want to move ${selectedItems.length} item(s) to the trash?`);

    if (confirmDelete) {
        selectedItems.forEach((item) => {
            const file = item.dataset.file;
            const fileName = path.basename(file);
            const trashPath = path.join(os.homedir(), '.Trash', fileName);
            fs.renameSync(file, trashPath);
            deletedItems.push({ element: item, file: file, trashPath: trashPath });
            item.remove();
        });
        updateButtonStates();
    }
});

undoBtn.addEventListener('click', () => {
    if (deletedItems.length > 0) {
        const lastDeleted = deletedItems.pop();
        fs.renameSync(lastDeleted.trashPath, lastDeleted.file);
        libraryContainer.insertBefore(lastDeleted.element, libraryContainer.firstChild);
        redoItems.push(lastDeleted);
        updateButtonStates();
    }
});

redoBtn.addEventListener('click', () => {
    if (redoItems.length > 0) {
        const lastRedone = redoItems.pop();
        fs.renameSync(lastRedone.file, lastRedone.trashPath);
        lastRedone.element.remove();
        deletedItems.push(lastRedone);
        updateButtonStates();
    }
});

locationBtn.addEventListener('click', () => {
    const selectedItem = libraryContainer.querySelector('.selected');
    if (selectedItem) {
        const file = selectedItem.dataset.file;
        shell.openPath(path.dirname(file));
    }
});

ipcRenderer.on('import-complete', (event, importedLibrary) => {
    library = importedLibrary;
    renderLibrary(library);
});

function renderLibrary(libraryData) {
    // Clear the library container
    libraryContainer.innerHTML = '';

    // Display the imported files in a grid with uniform preview icons
    Object.keys(libraryData).forEach((file) => {
        const fileItem = document.createElement('div');
        fileItem.classList.add('fileItem');
        fileItem.dataset.file = libraryData[file];

        const previewContainer = document.createElement('div');
        previewContainer.classList.add('previewContainer');

        const img = document.createElement('img');
        img.src = libraryData[file];
        previewContainer.appendChild(img);

        fileItem.appendChild(previewContainer);

        const fileName = document.createElement('span');
        fileName.textContent = path.basename(file);
        fileItem.appendChild(fileName);

        // Add click event listener for selection
        fileItem.addEventListener('click', (event) => {
            if (event.shiftKey && lastClickedItem) {
                const startIndex = Array.from(libraryContainer.children).indexOf(lastClickedItem);
                const endIndex = Array.from(libraryContainer.children).indexOf(fileItem);
                const [start, end] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];

                for (let i = start; i <= end; i++) {
                    libraryContainer.children[i].classList.add('selected');
                }
            } else if (event.metaKey || event.ctrlKey) {
                fileItem.classList.toggle('selected');
            } else {
                libraryContainer.querySelectorAll('.selected').forEach((item) => item.classList.remove('selected'));
                fileItem.classList.add('selected');
            }
            updateButtonStates();
        });

        // Add double click event listener for opening the file
        fileItem.addEventListener('dblclick', () => {
            shell.openPath(libraryData[file]);
        });

        libraryContainer.appendChild(fileItem);
    });
}

searchInput.addEventListener('input', () => {
    // Clear the previous timeout
    clearTimeout(searchTimeout);

    // Set a new timeout to perform the search after a short delay
    searchTimeout = setTimeout(() => {
        const searchQuery = searchInput.value.trim().toLowerCase();
        const searchTerms = searchQuery.split('+').map((term) => term.trim());

        const filteredLibrary = {};

        Object.keys(library).forEach((file) => {
            const fileName = file.toLowerCase();
            const fileExtension = path.extname(file).toLowerCase();

            if (searchTerms.every((term) => fileName.includes(term) || fileExtension.includes(term))) {
                filteredLibrary[file] = library[file];
            }
        });

        renderLibrary(filteredLibrary);
    }, 300); // Adjust the delay (in milliseconds) as needed
});

function updateButtonStates() {
    const selectedItems = libraryContainer.querySelectorAll('.selected');
    deleteBtn.disabled = selectedItems.length === 0;
    undoBtn.disabled = deletedItems.length === 0;
    redoBtn.disabled = redoItems.length === 0;
    locationBtn.disabled = selectedItems.length !== 1;
}