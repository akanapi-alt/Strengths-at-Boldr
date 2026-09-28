(function(){
  const path = location.pathname.split('/').pop() || 'index.html';
  const navPath = path === 'profile.html' ? 'grid.html' : path;
  document.querySelectorAll('[data-nav]').forEach(link => {
    if (link.getAttribute('href') === navPath) link.setAttribute('aria-current','page');
  });

  function asSet(value){
    if(value instanceof Set) return value;
    if(Array.isArray(value)) return new Set(value);
    return value ? new Set([value]) : new Set();
  }
  function uniqueValues(rows,key){
    return [...new Set(rows.map(row=>row?.[key]).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
  }
  function matchesPopulation(person,options={}){
    const locations=asSet(options.locations), departments=asSet(options.departments), statuses=asSet(options.statuses);
    if(locations.size && !locations.has(person.location)) return false;
    if(departments.size && !departments.has(person.department)) return false;
    if(statuses.size && !statuses.has(person.status)) return false;
    return true;
  }
  function appendValues(params,key,values){
    asSet(values).forEach(value=>params.append(key,value));
    return params;
  }
  function readSet(params,key){ return new Set(params.getAll(key).filter(Boolean)); }

  function xmlEsc(value){return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&apos;');}
  function worksheetXml({rows=[],merges=[],widths=[],freeze=null,filterRef='',dimensionRef=''}){
    const cols=widths.length?`<cols>${widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols>`:'';
    const pane=freeze&&(freeze.x||freeze.y)?`<sheetViews><sheetView workbookViewId="0"><pane${freeze.x?` xSplit="${freeze.x}"`:''}${freeze.y?` ySplit="${freeze.y}"`:''} topLeftCell="${freeze.topLeft||'A1'}" activePane="${freeze.x&&freeze.y?'bottomRight':freeze.x?'topRight':'bottomLeft'}" state="frozen"/></sheetView></sheetViews>`:'<sheetViews><sheetView workbookViewId="0"/></sheetViews>';
    const dimension=dimensionRef?`<dimension ref="${dimensionRef}"/>`:'';
    const filter=filterRef?`<autoFilter ref="${filterRef}"/>`:'';
    const merge=merges.length?`<mergeCells count="${merges.length}">${merges.map(m=>`<mergeCell ref="${m}"/>`).join('')}</mergeCells>`:'';
    /* SpreadsheetML element order matters. In particular autoFilter must precede mergeCells. */
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${dimension}${pane}<sheetFormatPr defaultRowHeight="15"/>${cols}<sheetData>${rows.join('')}</sheetData>${filter}${merge}</worksheet>`;
  }

  async function downloadWorkbook({sheets,stylesXml,filename}){
    if(typeof JSZip==='undefined') throw new Error('Excel export library could not be loaded.');
    if(!Array.isArray(sheets)||!sheets.length) throw new Error('No report sheets were provided.');
    const zip=new JSZip();
    zip.file('[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((sheet,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`);
    zip.folder('_rels').file('.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
    zip.folder('xl').file('workbook.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((sheet,i)=>`<sheet name="${xmlEsc(sheet.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`).file('styles.xml',stylesXml);
    zip.folder('xl').folder('_rels').file('workbook.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((sheet,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
    const ws=zip.folder('xl').folder('worksheets');
    sheets.forEach((sheet,i)=>ws.file(`sheet${i+1}.xml`,sheet.xml));
    const blob=await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=filename||'Boldr_Strengths_Report.xlsx';a.style.display='none';document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    return blob;
  }

  window.BoldrFilterUtils={asSet,uniqueValues,matchesPopulation,appendValues,readSet};
  window.BoldrExcelUtils={downloadWorkbook,xmlEsc,worksheetXml};
})();
