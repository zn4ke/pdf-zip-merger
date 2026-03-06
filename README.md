# PDF Zip (Interleave)

This script interleaves the pages of two PDFs, which is very useful when scanning a double-sided document using a scanner that only scans one side at a time (e.g., scanning all fronts, flipping the stack, and scanning all backs).

## Requirements

1. Python 3 installed.
2. Install the requirements:
   ```cmd
   pip install -r requirements.txt
   ```

## Usage

### 1. Web App - PDF Zip Interleaver (Browser-only)

⚡ **Try it live:** [https://zn4ke.github.io/pdf-zip-merger/zip-merger/](https://zn4ke.github.io/pdf-zip-merger/zip-merger/)

You can run this entirely in your browser without installing anything or using the command line. Since it uses `pdf-lib`, all processing happens locally on your machine, ensuring complete privacy.

1. Open the [live demo](https://zn4ke.github.io/pdf-zip-merger/zip-merger/) or the local `zip-merger/index.html` file in your preferred web browser.
2. Drag and drop your front pages PDF and back pages PDF into the respective areas.
3. Toggle the "Reverse Back Pages" switch if necessary.
4. Click **Zipp it!** and download the merged result.

### 2. Web App - PDF Composer Page Merger (Browser-only)

⚡ **Try it live:** [https://zn4ke.github.io/pdf-zip-merger/pdf-composer/](https://zn4ke.github.io/pdf-zip-merger/pdf-composer/)

Combine multiple PDFs, reorganize page order perfectly via drag-and-drop, and instantly rotate any mistakenly oriented pages.

1. Open the [live demo](https://zn4ke.github.io/pdf-zip-merger/pdf-composer/) or the local `pdf-composer/index.html` file in your preferred web browser.
2. Drag and drop multiple PDF files into the designated area.
3. Drag pages around to reorder them exactly as you wish. 
4. Rotate any pages that imported in the wrong direction.
5. Click **Export Document** to save the configured PDF.

#### Running the Web App in Docker (Nginx)

If you prefer to serve the web application from a Docker container (e.g., for self-hosting on your network), you can build the Nginx-based image:

```cmd
docker build -f Dockerfile.web -t pdf-zip-web .
```

Then run it and map port 80 to a port on your host machine (e.g., 8080):

```cmd
docker run -p 8080:80 --rm pdf-zip-web
```

After it starts, open your browser and navigate to `http://localhost:8080`.

### Using Python

```cmd
python interleave_pdfs.py <fronts.pdf> <backs.pdf> <output.pdf>
```

If your scanner output for the back pages is in reverse order (which is common for Automatic Document Feeders when you just flip the stack), use the `-r` or `--reverse-backs` flag:

```cmd
python interleave_pdfs.py <fronts.pdf> <backs.pdf> <output.pdf> -r
```

**Example:**
```cmd
python interleave_pdfs.py scan_fronts.pdf scan_backs.pdf complete_document.pdf -r
```

### Using Docker

You can also run the script inside a Docker container. First, build the image:

```cmd
docker build -t pdf-zip .
```

Then, run the container, mounting your current directory to access the PDFs:

```cmd
# On Windows (cmd)
docker run --rm -v "%cd%:/data" pdf-zip /data/fronts.pdf /data/backs.pdf /data/output.pdf -r

# On Windows (PowerShell)
docker run --rm -v "${PWD}:/data" pdf-zip /data/fronts.pdf /data/backs.pdf /data/output.pdf -r

# On Linux/macOS
docker run --rm -v "$(pwd):/data" pdf-zip /data/fronts.pdf /data/backs.pdf /data/output.pdf -r
```