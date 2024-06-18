const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

// Handle file import
ipcMain.on('import-files', (event) => {
    dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'openDirectory', 'multiSelections'],
    }).then((result) => {
        if (!result.canceled) {
            const files = result.filePaths;
            const library = {};

            files.forEach((file) => {
                const stats = fs.statSync(file);
                if (stats.isDirectory()) {
                    // Ingest files from subdirectories recursively
                    const subFiles = getFilesRecursive(file);
                    subFiles.forEach((subFile) => {
                        const relativePath = path.relative(file, subFile);
                        library[relativePath] = subFile;
                    });
                } else {
                    const fileName = path.basename(file);
                    library[fileName] = file;
                }
            });

            event.reply('import-complete', library);
        }
    });
});

// Recursive function to get files from subdirectories
function getFilesRecursive(directory) {
    let files = [];

    fs.readdirSync(directory).forEach((file) => {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            files = files.concat(getFilesRecursive(filePath));
        } else {
            files.push(filePath);
        }
    });

    return files;
}