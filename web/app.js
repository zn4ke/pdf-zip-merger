document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const frontsInput = document.getElementById('fronts-file');
    const backsInput = document.getElementById('backs-file');
    const frontsDropzone = document.getElementById('fronts-dropzone');
    const backsDropzone = document.getElementById('backs-dropzone');
    const frontsName = document.getElementById('fronts-name');
    const backsName = document.getElementById('backs-name');
    const reverseToggle = document.getElementById('reverse-backs');
    const loadingDiv = document.getElementById('loading');
    const resultContainer = document.getElementById('result-container');
    const downloadLink = document.getElementById('download-link');

    // State
    let frontsFile = null;
    let backsFile = null;

    // Helper to trigger merge
    async function triggerMerge() {
        if (!frontsFile || !backsFile) return;

        // UI updates
        loadingDiv.classList.remove('hidden');
        resultContainer.classList.add('hidden');

        try {
            await mergePDFs(frontsFile, backsFile, reverseToggle.checked);
        } catch (error) {
            console.error('Error merging PDFs:', error);
            alert('Oh no! Something went wrong while merging the PDFs. Make sure they are valid PDF files.');
        } finally {
            loadingDiv.classList.add('hidden');
        }
    }

    // Trigger on toggle change
    reverseToggle.addEventListener('change', triggerMerge);

    // Setup drag and drop events for a dropzone
    function setupDropzone(dropzone, input, nameElement, isFront) {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        // Highlight dropzone when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.remove('dragover');
            }, false);
        });

        // Handle dropped files
        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files, input, nameElement, dropzone, isFront);
        }, false);

        // Handle file input change
        input.addEventListener('change', function (e) {
            handleFiles(this.files, this, nameElement, dropzone, isFront);
        });
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleFiles(files, input, nameElement, dropzone, isFront) {
        if (files.length > 0) {
            const file = files[0];

            if (file.type !== 'application/pdf') {
                alert('Please upload a valid PDF file.');
                return;
            }

            // Update UI
            nameElement.textContent = file.name;
            dropzone.classList.add('has-file');

            // Update state
            if (isFront) {
                frontsFile = file;
            } else {
                backsFile = file;
            }

            // Trigger merge if both files exist
            triggerMerge();
        }
    }

    // Initialize dropzones
    setupDropzone(frontsDropzone, frontsInput, frontsName, true);
    setupDropzone(backsDropzone, backsInput, backsName, false);

    // The core logic using pdf-lib
    async function mergePDFs(fronts, backs, reverseBacks) {
        // Read files as ArrayBuffers
        const frontBuffer = await fronts.arrayBuffer();
        const backBuffer = await backs.arrayBuffer();

        // Load the PDF documents
        const { PDFDocument } = window.PDFLib;
        const frontDoc = await PDFDocument.load(frontBuffer);
        const backDoc = await PDFDocument.load(backBuffer);
        const mergedDoc = await PDFDocument.create();

        // Copy all pages over to the new doc structure
        const frontPages = await mergedDoc.copyPages(frontDoc, frontDoc.getPageIndices());
        const backPages = await mergedDoc.copyPages(backDoc, backDoc.getPageIndices());

        if (reverseBacks) {
            backPages.reverse();
        }

        const maxLen = Math.max(frontPages.length, backPages.length);

        // Interleave
        for (let i = 0; i < maxLen; i++) {
            if (i < frontPages.length) {
                mergedDoc.addPage(frontPages[i]);
            }
            if (i < backPages.length) {
                mergedDoc.addPage(backPages[i]);
            }
        }

        // Save and create blob
        const pdfBytes = await mergedDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        // Setup download link and preview frame
        const url = URL.createObjectURL(blob);
        downloadLink.href = url;

        const previewContainer = document.getElementById('pdf-preview-container');
        // Using <object> or <embed> is generally more reliable for PDF blobs in Chrome than <iframe>
        previewContainer.innerHTML = `<embed src="${url}#view=FitH" type="application/pdf" width="100%" height="100%" style="border: none;" />`;

        // Show result success panel
        resultContainer.classList.remove('hidden');

        // Scroll to result smoothly
        setTimeout(() => {
            resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
});
