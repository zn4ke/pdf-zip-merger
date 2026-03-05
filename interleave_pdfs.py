import argparse
from pypdf import PdfReader, PdfWriter

def main():
    parser = argparse.ArgumentParser(description="Interleave front and back pages of scanned PDFs.")
    parser.add_argument("fronts", help="Path to the PDF containing the front pages.")
    parser.add_argument("backs", help="Path to the PDF containing the back pages.")
    parser.add_argument("output", help="Path for the merged output PDF.")
    parser.add_argument("-r", "--reverse-backs", action="store_true", 
                        help="Reverse the order of the back pages (useful for many ADF scanners where the backside stack is reversed).")
    
    args = parser.parse_args()
    
    try:
        fronts_reader = PdfReader(args.fronts)
        backs_reader = PdfReader(args.backs)
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return

    writer = PdfWriter()

    front_pages = fronts_reader.pages
    back_pages = backs_reader.pages
    
    # Check if we need to reverse the back pages
    if args.reverse_backs:
        back_pages = list(reversed(back_pages))

    max_len = max(len(front_pages), len(back_pages))

    for i in range(max_len):
        if i < len(front_pages):
            writer.add_page(front_pages[i])
        if i < len(back_pages):
            writer.add_page(back_pages[i])

    try:
        with open(args.output, "wb") as f_out:
            writer.write(f_out)
            
        print(f"Successfully interleaved '{args.fronts}' and '{args.backs}' into '{args.output}'.")
        print(f"Total pages in output: {len(writer.pages)}")
    except Exception as e:
        print(f"Error writing PDF: {e}")

if __name__ == "__main__":
    main()
