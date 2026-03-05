FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY interleave_pdfs.py .

ENTRYPOINT ["python", "/app/interleave_pdfs.py"]
