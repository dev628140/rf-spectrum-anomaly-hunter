import os
import re
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def create_element(name):
    return OxmlElement(name)

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table):
    tblPr = table._element.xpath('w:tblPr')
    if tblPr:
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>\n'
            f'  <w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>\n'
            f'  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="444444"/>\n'
            f'  <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/>\n'
            f'  <w:left w:val="none"/>\n'
            f'  <w:right w:val="none"/>\n'
            f'  <w:insideV w:val="none"/>\n'
            f'</w:tblBorders>'
        )
        tblPr[0].append(borders)

def build_docx(md_path, docx_path):
    doc = Document()
    
    # Configure Document Margins (1 inch everywhere)
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        
    # Configure Normal Style Font
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Calibri'
    font.size = Pt(11)
    font.color.rgb = RGBColor(0x33, 0x33, 0x33)
    
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    in_code_block = False
    code_lines = []
    
    in_table = False
    table_rows = []
    
    i = 0
    while i < len(lines):
        line = lines[i].rstrip('\n')
        
        # Handle Code Block
        if line.startswith('```'):
            if not in_code_block:
                in_code_block = True
                code_lines = []
            else:
                in_code_block = False
                # Add Code block container
                p = doc.add_paragraph()
                p.paragraph_format.left_indent = Inches(0.4)
                p.paragraph_format.right_indent = Inches(0.4)
                p.paragraph_format.space_before = Pt(6)
                p.paragraph_format.space_after = Pt(6)
                
                # Add border and background to paragraph via xml shading
                pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:left w:val="single" w:sz="24" w:space="8" w:color="008B8B"/></w:pBdr>')
                shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="F5F5F5"/>')
                p._element.get_or_add_pPr().append(pBdr)
                p._element.get_or_add_pPr().append(shd)
                
                # Write code text
                code_text = '\n'.join(code_lines)
                run = p.add_run(code_text)
                run.font.name = 'Consolas'
                run.font.size = Pt(9.5)
                run.font.color.rgb = RGBColor(0x00, 0x5F, 0x5F)
                
            i += 1
            continue
            
        if in_code_block:
            code_lines.append(line)
            i += 1
            continue
            
        # Handle Table
        if line.startswith('|'):
            # Check if this is the separator row
            if '---' in line or ':---' in line:
                i += 1
                continue
            
            in_table = True
            # Parse cells
            cells = [c.strip() for c in line.split('|')[1:-1]]
            table_rows.append(cells)
            i += 1
            continue
        else:
            if in_table:
                # We reached the end of the table, so build it now
                if table_rows:
                    num_cols = len(table_rows[0])
                    num_rows = len(table_rows)
                    table = doc.add_table(rows=num_rows, cols=num_cols)
                    table.autofit = True
                    set_table_borders(table)
                    
                    # Style cells
                    for r_idx, row_cells in enumerate(table_rows):
                        for c_idx, cell_value in enumerate(row_cells):
                            cell = table.cell(r_idx, c_idx)
                            cell.text = ""  # clear default
                            
                            p = cell.paragraphs[0]
                            p.paragraph_format.space_before = Pt(4)
                            p.paragraph_format.space_after = Pt(4)
                            
                            # Clean markdown bold/italics from values
                            clean_value = re.sub(r'\*\*(.*?)\*\*', r'\1', cell_value)
                            clean_value = re.sub(r'\$(.*?)\$', r'\1', clean_value) # remove math delimiters
                            
                            run = p.add_run(clean_value)
                            set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
                            
                            if r_idx == 0:
                                # Header Row Style
                                set_cell_background(cell, "07111F")
                                run.bold = True
                                run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                                run.font.size = Pt(10)
                                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                            else:
                                # Data Row Style
                                run.font.size = Pt(9.5)
                                if r_idx % 2 == 1:
                                    set_cell_background(cell, "FBFBFB")
                                else:
                                    set_cell_background(cell, "F2F5F8")
                                    
                                if "**" in cell_value:
                                    run.bold = True
                                    
                                if c_idx == 0:
                                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                                else:
                                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                                    
                table_rows = []
                in_table = False
                
        # Skip empty lines
        if not line.strip():
            i += 1
            continue
            
        # Handle Headings
        if line.startswith('# '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(24)
            p.paragraph_format.space_after = Pt(8)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run(line[2:])
            run.bold = True
            run.font.size = Pt(20)
            run.font.color.rgb = RGBColor(0x07, 0x11, 0x1F)
            
        elif line.startswith('## '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(18)
            p.paragraph_format.space_after = Pt(6)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run(line[3:])
            run.bold = True
            run.font.size = Pt(15)
            run.font.color.rgb = RGBColor(0x00, 0x8B, 0x8B)
            
        elif line.startswith('### '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run(line[4:])
            run.bold = True
            run.font.size = Pt(12.5)
            run.font.color.rgb = RGBColor(0x07, 0x11, 0x1F)
            
        elif line.startswith('#### '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(3)
            run = p.add_run(line[5:])
            run.bold = True
            run.font.italic = True
            run.font.size = Pt(11.5)
            run.font.color.rgb = RGBColor(0x00, 0x8B, 0x8B)
            
        # Handle Bullet List Items
        elif line.startswith('* ') or line.startswith('- '):
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            
            content = line[2:]
            # Parse bold/italics
            parts = re.split(r'(\*\*.*?\*\*)', content)
            for part in parts:
                if part.startswith('**') and part.endswith('**'):
                    r = p.add_run(part[2:-2])
                    r.bold = True
                else:
                    # check math
                    math_parts = re.split(r'(\$.*?\$)', part)
                    for m_part in math_parts:
                        if m_part.startswith('$') and m_part.endswith('$'):
                            r = p.add_run(m_part[1:-1])
                            r.font.italic = True
                        else:
                            p.add_run(m_part)
                            
        # Handle Horizontal Rules
        elif line.strip() == '---':
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(12)
            run = p.add_run("―" * 40)
            run.font.color.rgb = RGBColor(0xCC, 0xCC, 0xCC)
            
        # Handle Standard Paragraph
        else:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.line_spacing = 1.15
            
            # Clean display equations or render inline math elegantly
            parts = re.split(r'(\*\*.*?\*\*|\$.*?\$)', line)
            for part in parts:
                if part.startswith('**') and part.endswith('**'):
                    r = p.add_run(part[2:-2])
                    r.bold = True
                elif part.startswith('$') and part.endswith('$'):
                    r = p.add_run(part[1:-1])
                    r.font.italic = True
                else:
                    p.add_run(part)
                    
        i += 1
        
    try:
        doc.save(docx_path)
        print(f"Successfully generated DOCX at: {docx_path}")
    except PermissionError:
        backup_path = docx_path.replace(".docx", "_updated.docx")
        doc.save(backup_path)
        print(f"Successfully generated DOCX at: {backup_path} (Backup due to active Word lock)")

if __name__ == "__main__":
    md_file = "C:/Users/Dell/Downloads/Compressed/Rf-spectrum-anomaly-hunter/documentation/model_technical_documentation.md"
    docx_file = "C:/Users/Dell/Downloads/Compressed/Rf-spectrum-anomaly-hunter/documentation/model_technical_documentation.docx"
    build_docx(md_file, docx_file)
