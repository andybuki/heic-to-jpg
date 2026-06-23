(() => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const actions = document.getElementById('actions');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const convertBtn = document.getElementById('convertBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const clearBtn = document.getElementById('clearBtn');

    let files = [];
    let convertedBlobs = new Map();

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const droppedFiles = Array.from(e.dataTransfer.files).filter(isHeic);
        if (droppedFiles.length) addFiles(droppedFiles);
    });

    fileInput.addEventListener('change', () => {
        const selected = Array.from(fileInput.files).filter(isHeic);
        if (selected.length) addFiles(selected);
        fileInput.value = '';
    });

    qualitySlider.addEventListener('input', () => {
        qualityValue.textContent = qualitySlider.value + '%';
    });

    convertBtn.addEventListener('click', convertAll);
    downloadBtn.addEventListener('click', downloadZip);
    clearBtn.addEventListener('click', clearAll);

    function isHeic(file) {
        const name = file.name.toLowerCase();
        return name.endsWith('.heic') || name.endsWith('.heif');
    }

    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    function getBaseName(filename) {
        return filename.replace(/\.(heic|heif)$/i, '');
    }

    function addFiles(newFiles) {
        files = files.concat(newFiles);
        fileList.classList.add('visible');
        actions.classList.add('visible');
        renderFileList();
        resetConvertBtn();
    }

    function renderFileList() {
        fileList.innerHTML = '';
        files.forEach((file, index) => {
            const blob = convertedBlobs.get(index);
            const item = document.createElement('div');
            item.className = 'file-item';

            const left = document.createElement('div');
            left.className = 'file-item-left';

            const dot = document.createElement('div');
            dot.className = 'file-dot' + (blob ? ' done' : '');

            const name = document.createElement('span');
            name.className = 'file-item-name';
            name.textContent = file.name;

            left.appendChild(dot);
            left.appendChild(name);

            const right = document.createElement('div');
            right.className = 'file-item-right';

            const size = document.createElement('span');
            size.className = 'file-item-size';
            size.textContent = formatSize(file.size);
            if (blob) {
                size.textContent += ' → ' + formatSize(blob.size);
            }
            right.appendChild(size);

            if (blob) {
                const dlBtn = document.createElement('button');
                dlBtn.className = 'file-item-download';
                dlBtn.textContent = 'Save';
                dlBtn.addEventListener('click', () => downloadSingle(index));
                right.appendChild(dlBtn);
            }

            item.appendChild(left);
            item.appendChild(right);
            fileList.appendChild(item);
        });
    }

    async function convertAll() {
        if (!files.length) return;

        convertBtn.disabled = true;
        convertBtn.textContent = 'Converting…';
        convertBtn.style.opacity = '0.6';
        downloadBtn.classList.remove('visible');

        for (let i = 0; i < files.length; i++) {
            if (convertedBlobs.has(i)) continue;

            setDotStatus(i, 'converting');

            try {
                const blob = await heic2any({
                    blob: files[i],
                    toType: 'image/jpeg',
                    quality: qualitySlider.value / 100,
                });
                const result = Array.isArray(blob) ? blob[0] : blob;
                convertedBlobs.set(i, result);
                setDotStatus(i, 'done');
            } catch (err) {
                console.error('Error converting ' + files[i].name + ':', err);
                setDotStatus(i, 'error');
            }
        }

        renderFileList();

        if (convertedBlobs.size > 0) {
            convertBtn.textContent = '✓ Converted';
            convertBtn.style.opacity = '1';
            convertBtn.classList.add('success');
            downloadBtn.classList.add('visible');

            if (convertedBlobs.size === 1) {
                downloadSingle(convertedBlobs.keys().next().value);
            }
        } else {
            resetConvertBtn();
        }
    }

    function setDotStatus(index, status) {
        const items = fileList.querySelectorAll('.file-item');
        if (!items[index]) return;
        const dot = items[index].querySelector('.file-dot');
        if (dot) {
            dot.className = 'file-dot ' + status;
        }
    }

    function resetConvertBtn() {
        convertBtn.textContent = 'Convert All';
        convertBtn.style.opacity = '1';
        convertBtn.style.background = '';
        convertBtn.disabled = false;
        convertBtn.classList.remove('success');
    }

    function downloadSingle(index) {
        const blob = convertedBlobs.get(index);
        if (!blob) return;
        saveAs(blob, getBaseName(files[index].name) + '.jpg');
    }

    async function downloadZip() {
        if (convertedBlobs.size === 0) return;

        downloadBtn.disabled = true;
        downloadBtn.textContent = 'Zipping…';

        const zip = new JSZip();
        convertedBlobs.forEach((blob, index) => {
            zip.file(getBaseName(files[index].name) + '.jpg', blob);
        });

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'heic-to-jpg.zip');

        downloadBtn.textContent = 'Download ZIP';
        downloadBtn.disabled = false;
    }

    function clearAll() {
        files = [];
        convertedBlobs = new Map();
        fileList.innerHTML = '';
        fileList.classList.remove('visible');
        actions.classList.remove('visible');
        downloadBtn.classList.remove('visible');
        resetConvertBtn();
    }
})();
