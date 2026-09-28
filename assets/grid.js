(function(){
  const data=window.BOLDR_STRENGTHS_DATA;
  const F=window.BoldrFilterUtils;
  if(!data||!F) return;
  const {employees,domains,themeOrder,meta}=data;
  const domainColor=Object.fromEntries(Object.entries(domains).map(([k,v])=>[k,v.color]));
  const selected={domains:new Set(),strengths:new Set(),departments:new Set(),locations:new Set(),statuses:new Set(['Active'])};
  const MATRIX_PAGE_SIZE=25;
  let viewMode='cards';
  let matrixPage=1;
  const $=id=>document.getElementById(id);
  const searchMobile=$('search'), searchDesktop=$('searchDesktop'), grid=$('peopleGrid'), matrix=$('peopleMatrix'), count=$('resultsCount'), scope=$('resultsScope'), activeFilters=$('activeFilters');
  const mobileToggle=$('mobileFilterToggle'), mobileFilterCount=$('mobileFilterCount');
  const esc=v=>String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const initials=name=>String(name||'').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
  const unique=key=>F.uniqueValues(employees,key);
  const searchValue=()=>searchMobile.value.trim();
  const setSearch=value=>{searchMobile.value=value||'';searchDesktop.value=value||'';};


  const filterConfig=[
    {container:'domainOptions',badge:'domainBadge',key:'domains',items:Object.keys(domains),mode:'and'},
    {container:'strengthOptions',badge:'strengthBadge',key:'strengths',items:themeOrder,mode:'and'},
    {container:'departmentOptions',badge:'departmentBadge',key:'departments',items:unique('department'),mode:'or'},
    {container:'locationOptions',badge:'locationBadge',key:'locations',items:unique('location'),mode:'or'}
  ];

  function hasAll(haystack,need){for(const v of need) if(!haystack.has(v)) return false;return true;}
  function matchesState(e,state=selected,query=searchValue()){
    if(!F.matchesPopulation(e,{locations:state.locations,departments:state.departments,statuses:state.statuses})) return false;
    const q=String(query||'').toLowerCase();
    if(q && !`${e.name} ${e.role}`.toLowerCase().includes(q)) return false;
    const themes=new Set((e.strengths||[]).map(s=>s.theme));
    const ds=new Set((e.strengths||[]).map(s=>s.domain));
    if(!hasAll(themes,state.strengths)) return false;
    if(!hasAll(ds,state.domains)) return false;
    return true;
  }
  function cloneState(){return Object.fromEntries(Object.entries(selected).map(([k,v])=>[k,new Set(v)]));}
  function optionCount(key,item,mode){
    const state=cloneState();
    if(mode==='and') state[key].add(item); else state[key]=new Set([item]);
    return employees.filter(e=>matchesState(e,state)).length;
  }
  function resetMatrixPage(){matrixPage=1;}

  function makeChecks(config){
    const container=$(config.container); container.innerHTML='';
    config.items.forEach(item=>{
      const amount=optionCount(config.key,item,config.mode), isSelected=selected[config.key].has(item);
      const label=document.createElement('label'); label.className='check-row'+(!amount&&!isSelected?' zero-option':'');
      const input=document.createElement('input'); input.type='checkbox'; input.value=item; input.dataset.filterKey=config.key; input.checked=isSelected; input.disabled=!amount&&!isSelected;
      const text=document.createElement('span'); text.className='check-label'; text.textContent=item;
      const amountEl=document.createElement('span'); amountEl.className='check-count'; amountEl.textContent=amount;
      input.addEventListener('change',()=>{input.checked?selected[config.key].add(item):selected[config.key].delete(item);resetMatrixPage();render();});
      label.append(input,text,amountEl); container.append(label);
    });
  }
  function renderStatusOptions(){
    const container=$('statusOptions'); container.innerHTML='';
    const choices=[
      {label:'Active',value:'Active',state:new Set(['Active'])},
      {label:'Inactive',value:'Inactive',state:new Set(['Inactive'])},
      {label:'All profiles',value:'All',state:new Set()}
    ];
    choices.forEach(choice=>{
      const state=cloneState(); state.statuses=choice.state;
      const amount=employees.filter(e=>matchesState(e,state)).length;
      const label=document.createElement('label'); label.className='check-row status-choice';
      const input=document.createElement('input'); input.type='radio'; input.name='directoryStatus'; input.value=choice.value;
      input.checked=!selected.statuses.size?choice.value==='All':selected.statuses.has(choice.value);
      const text=document.createElement('span'); text.className='check-label'; text.textContent=choice.label;
      const amountEl=document.createElement('span'); amountEl.className='check-count'; amountEl.textContent=amount;
      input.addEventListener('change',()=>{if(!input.checked)return;selected.statuses.clear();if(choice.value!=='All')selected.statuses.add(choice.value);resetMatrixPage();render();});
      label.append(input,text,amountEl); container.append(label);
    });
  }
  function rebuildOptions(){filterConfig.forEach(makeChecks);renderStatusOptions();}
  function updateBadges(){
    filterConfig.forEach(c=>{
      $(c.badge).textContent=selected[c.key].size;
      $(c.container).closest('details').classList.toggle('has-selection',selected[c.key].size>0);
    });
    $('statusBadge').textContent=selected.statuses.size?1:0;
    $('statusOptions').closest('details').classList.toggle('has-selection',selected.statuses.size>0);
    const activeTotal=[...Object.values(selected)].reduce((n,s)=>n+s.size,0)+(searchValue()?1:0);
    mobileFilterCount.textContent=activeTotal;
  }

  function applyQuery(){
    const p=new URLSearchParams(location.search), map={domain:'domains',strength:'strengths',department:'departments',location:'locations'};
    for(const [param,key] of Object.entries(map)){
      const vals=p.getAll(param); if(vals.length){selected[key].clear();vals.forEach(v=>selected[key].add(v));}
    }
    if(p.has('status')){
      selected.statuses.clear(); const raw=p.getAll('status'); raw.forEach(v=>{if(v==='Active'||v==='Inactive')selected.statuses.add(v);}); if(raw.includes('All'))selected.statuses.clear();
    }
    setSearch(p.get('search')||'');
    if(p.get('view')==='matrix') viewMode='matrix';
    const page=Number(p.get('page')); if(Number.isInteger(page)&&page>0) matrixPage=page;
  }
  applyQuery();

  function stateParams(){
    const p=new URLSearchParams();
    F.appendValues(p,'domain',selected.domains);F.appendValues(p,'strength',selected.strengths);F.appendValues(p,'department',selected.departments);F.appendValues(p,'location',selected.locations);
    if(!selected.statuses.size)p.set('status','All'); else F.appendValues(p,'status',selected.statuses);
    if(searchValue())p.set('search',searchValue());
    if(viewMode==='matrix'){p.set('view','matrix');if(matrixPage>1)p.set('page',String(matrixPage));}
    return p;
  }
  function syncUrl(){const p=stateParams();const hash=location.hash==='#directoryResults'?'#directoryResults':'';history.replaceState(null,'',`${location.pathname}?${p.toString()}${hash}`);}
  function returnUrl(){return `grid.html?${stateParams().toString()}#directoryResults`;}

  function leadingDomain(e){
    const counts={};(e.strengths||[]).slice(0,5).forEach(s=>counts[s.domain]=(counts[s.domain]||0)+1);
    return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||'Executing';
  }
  function cardStrengthRow(s){
    const domain=s.domain||'Executing', color=domainColor[domain]||'#FF6B00';
    return `<div class="card-strength-row" style="--strength-domain:${color}"><span class="card-strength-rank">${String(s.rank).padStart(2,'0')}</span><span class="card-strength-name">${esc(s.theme)}</span><span class="card-strength-domain-dot" aria-hidden="true"></span><span class="sr-only">${esc(domain)} domain</span></div>`;
  }
  function card(e){
    const accent=domainColor[leadingDomain(e)]||'#FF6B00', href=`profile.html?id=${encodeURIComponent(e.id)}&from=${encodeURIComponent(returnUrl())}`;
    const top=(e.strengths||[]).slice(0,5);
    const themeLabel=top.length?`Top ${top.length} ${top.length===1?'theme':'themes'}`:'Strengths';
    return `<a class="person-card person-card-v12 person-card-v18" style="--card-accent:${accent}" href="${href}" aria-label="View ${esc(e.name)} strengths profile"><div class="person-card-head"><span class="initials">${esc(initials(e.name))}</span><div class="person-heading"><h2 class="person-name">${esc(e.name)}</h2><p class="person-role">${esc(e.role||'Role not listed')}</p><p class="person-team">${esc(e.department||'Department not listed')}</p></div></div><div class="card-divider"></div><span class="card-themes-label">${themeLabel}</span><div class="card-strength-list">${top.length?top.map(cardStrengthRow).join(''):'<span class="empty-pill">Strengths not currently available</span>'}</div><div class="person-card-footer"><span>View profile</span><span class="person-card-footer-arrow" aria-hidden="true">→</span></div></a>`;
  }

  function chip(label,key,value){return `<button class="active-filter-chip" data-key="${key}" data-value="${esc(value)}" type="button">${esc(label)} <span aria-hidden="true">×</span><span class="sr-only">Remove filter</span></button>`;}
  function renderActiveFilters(){
    const chips=[], labels={domains:'Domain',strengths:'Strength',departments:'Department',locations:'Location',statuses:'Status'};
    Object.entries(labels).forEach(([k,label])=>selected[k].forEach(v=>chips.push(chip(`${label}: ${v}`,k,v))));
    if(searchValue()) chips.push(chip(`Search: ${searchValue()}`,'search',searchValue()));
    activeFilters.innerHTML=chips.length?`<span class="active-filter-label">Active filters</span>${chips.join('')}`:'<span class="active-filter-empty">No additional filters applied.</span>';
    activeFilters.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
      if(button.dataset.key==='search')setSearch(''); else selected[button.dataset.key].delete(button.dataset.value); resetMatrixPage(); render();
    }));
  }

  function filteredRows(){return employees.filter(e=>matchesState(e));}
  function rgba(hex,alpha){const h=hex.replace('#','');const n=parseInt(h,16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${alpha})`;}
  function rankCell(e,theme){
    const s=(e.strengths||[]).find(x=>x.theme===theme); if(!s)return '<td class="matrix-rank-cell empty" aria-label="Not in available Top 10"></td>';
    const color=domainColor[s.domain]||'#75808A', alpha=.10+((11-Math.min(Math.max(s.rank,1),10))/10)*.70;
    return `<td class="matrix-rank-cell" style="background:${rgba(color,alpha)}" title="${esc(e.name)} · ${esc(theme)} · rank ${s.rank}"><span>${s.rank}</span></td>`;
  }
  function xmlEsc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));}
  function xlsxCol(n){let out='';while(n){const r=(n-1)%26;out=String.fromCharCode(65+r)+out;n=Math.floor((n-1)/26);}return out;}
  function xlsxCell(ref,value,style=0){if(typeof value==='number'&&Number.isFinite(value))return `<c r="${ref}" s="${style}"><v>${value}</v></c>`;return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(value)}</t></is></c>`;}
  function xlsxRow(r,cells){return `<row r="${r}">${cells.join('')}</row>`;}
  function mixHex(hex,whiteWeight){const h=hex.replace('#','');const n=parseInt(h,16),mix=(v)=>Math.round(v+(255-v)*whiteWeight).toString(16).padStart(2,'0').toUpperCase();return mix((n>>16)&255)+mix((n>>8)&255)+mix(n&255);}
  function matrixFilterSummary(){
    const values=(set,empty)=>set.size?[...set].join(', '):empty;
    return [
      ['Profiles in export',filteredRows().length],
      ['Search',searchValue()||'None'],
      ['Domains',values(selected.domains,'All domains')],
      ['Strengths',values(selected.strengths,'All strengths')],
      ['Departments',values(selected.departments,'All departments')],
      ['Locations',values(selected.locations,'All locations')],
      ['Status',selected.statuses.size?[...selected.statuses].join(', '):'All profiles']
    ];
  }
  function matrixStylesXml(){
    const rankFills=[];
    const rankXfs=[];
    let fillId=10,styleId=12;
    const rankStyle={};
    Object.entries(domains).forEach(([domain,info])=>{
      rankStyle[domain]={};
      for(let rank=1;rank<=10;rank++){
        const white=.18+((rank-1)/9)*.70;
        rankFills.push(`<fill><patternFill patternType="solid"><fgColor rgb="FF${mixHex(info.color,white)}"/></patternFill></fill>`);
        rankXfs.push(`<xf numFmtId="0" fontId="5" fillId="${fillId}" borderId="1" xfId="0" applyFill="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>`);
        rankStyle[domain][rank]=styleId;fillId++;styleId++;
      }
    });
    const xml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="8"><font><sz val="10"/><color rgb="FF252D49"/><name val="Inter"/></font><font><b/><sz val="22"/><color rgb="FFFF6B00"/><name val="Inter"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Inter"/></font><font><b/><sz val="10"/><color rgb="FF252D49"/><name val="Inter"/></font><font><sz val="10"/><color rgb="FF667085"/><name val="Inter"/></font><font><b/><sz val="10"/><color rgb="FF17213D"/><name val="Inter"/></font><font><b/><sz val="10"/><color rgb="FF198754"/><name val="Inter"/></font><font><b/><sz val="10"/><color rgb="FFC0392B"/><name val="Inter"/></font></fonts><fills count="${10+rankFills.length}"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF252D49"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFF6B00"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFAF7F2"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF8C4CCF"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2D8CFF"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF22A86A"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFF6B00"/></patternFill></fill>${rankFills.join('')}</fills><borders count="2"><border/><border><left style="thin"><color rgb="FFE3DED6"/></left><right style="thin"><color rgb="FFE3DED6"/></right><top style="thin"><color rgb="FFE3DED6"/></top><bottom style="thin"><color rgb="FFE3DED6"/></bottom></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${12+rankXfs.length}"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFill="1" applyFont="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="5" borderId="1" xfId="0" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="6" borderId="1" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="9" borderId="1" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="7" borderId="1" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="8" borderId="1" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="6" fillId="5" borderId="1" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="7" fillId="5" borderId="1" xfId="0" applyFill="1" applyFont="1"/>${rankXfs.join('')}</cellXfs></styleSheet>`;
    return {xml,rankStyle};
  }
  function matrixSheetXml(rows,merges=[],widths=[],freeze={x:0,y:0,topLeft:'A1'},filterRef=''){
    const excel=window.BoldrExcelUtils;
    if(!excel?.worksheetXml) throw new Error('Shared Excel worksheet builder is unavailable.');
    const lastRow=Math.max(1,...rows.map(row=>Number((row.match(/<row r="(\d+)"/)||[])[1]||1)));
    const lastCol=xlsxCol(Math.max(1,widths.length));
    return excel.worksheetXml({rows,merges,widths,freeze,filterRef,dimensionRef:`A1:${lastCol}${lastRow}`});
  }
  async function downloadFilteredMatrix(rows,button){
    const excel=window.BoldrExcelUtils;
    if(!excel){alert('Excel export tools could not be loaded. Please refresh and try again.');return;}
    if(button?.disabled)return;
    const original=button?.textContent||'';if(button){button.disabled=true;button.textContent='Preparing matrix…';}
    try{
      const {xml:stylesXml,rankStyle}=matrixStylesXml(),groups=Object.entries(domains),allThemes=groups.flatMap(([,info])=>info.themes);
      const summary=[];
      summary.push(xlsxRow(1,[xlsxCell('A1','Boldr.',1)]));
      summary.push(xlsxRow(2,[xlsxCell('A2','EXPLORE PEOPLE • FILTERED MATRIX REPORT',2)]));
      summary.push(xlsxRow(4,[xlsxCell('A4','Report scope',3),xlsxCell('B4','Current Explore People filters',4)]));
      matrixFilterSummary().forEach(([label,value],i)=>{const r=5+i;summary.push(xlsxRow(r,[xlsxCell(`A${r}`,label,3),xlsxCell(`B${r}`,value,4)]));});
      summary.push(xlsxRow(13,[xlsxCell('A13','RANK LEGEND',2)]));
      summary.push(xlsxRow(14,[xlsxCell('A14','Rank 1',3),xlsxCell('B14','Highest ranked available theme; strongest domain tint',4)]));
      summary.push(xlsxRow(15,[xlsxCell('A15','Rank 10',3),xlsxCell('B15','Tenth ranked available theme; lightest domain tint',4)]));
      summary.push(xlsxRow(17,[xlsxCell('A17','INTERPRETATION NOTE',2)]));
      summary.push(xlsxRow(18,[xlsxCell('A18','Blank cells mean the theme is not present in the person’s available Top 10. Rank values describe placement, not performance or capability.',4)]));

      const sheetRows=[];
      sheetRows.push(xlsxRow(1,[xlsxCell('A1','Boldr.',1)]));
      sheetRows.push(xlsxRow(2,[xlsxCell('A2','FILTERED STRENGTHS MATRIX',2)]));
      const groupRow=4,headRow=5,startData=6,metaCols=6;
      const groupCells=[xlsxCell('A4','Profile context',2)];let c=metaCols+1;
      groups.forEach(([name,info],i)=>{groupCells.push(xlsxCell(`${xlsxCol(c)}4`,name,5+i));c+=info.themes.length;});
      sheetRows.push(xlsxRow(groupRow,groupCells));
      const headers=['#','Name','Job Title','Team / Department','Location','Status',...allThemes];
      sheetRows.push(xlsxRow(headRow,headers.map((h,i)=>xlsxCell(`${xlsxCol(i+1)}${headRow}`,h,9))));
      rows.forEach((e,i)=>{const r=startData+i,cells=[xlsxCell(`A${r}`,i+1,4),xlsxCell(`B${r}`,e.name,4),xlsxCell(`C${r}`,e.role||'Role not listed',4),xlsxCell(`D${r}`,e.department||'Department not listed',4),xlsxCell(`E${r}`,e.location||'Location not listed',4),xlsxCell(`F${r}`,e.status,e.status==='Active'?10:11)];const byTheme=Object.fromEntries((e.strengths||[]).map(s=>[s.theme,s]));allThemes.forEach((theme,j)=>{const strength=byTheme[theme],ref=`${xlsxCol(metaCols+j+1)}${r}`;cells.push(strength?xlsxCell(ref,strength.rank,rankStyle[strength.domain]?.[Math.min(Math.max(Number(strength.rank)||10,1),10)]||4):xlsxCell(ref,'',4));});sheetRows.push(xlsxRow(r,cells));});
      const groupMerges=['A4:F4'];let startCol=7;groups.forEach(([,info])=>{groupMerges.push(`${xlsxCol(startCol)}4:${xlsxCol(startCol+info.themes.length-1)}4`);startCol+=info.themes.length;});
      const endRow=Math.max(headRow,startData+rows.length-1);
      const matrixXml=matrixSheetXml(sheetRows,['A1:AN1','A2:AN2',...groupMerges],[6,26,30,24,16,14,...Array(34).fill(6.5)],{x:6,y:5,topLeft:'G6'},`A5:AN${endRow}`);
      const summaryXml=matrixSheetXml(summary,['A1:H1','A2:H2','A13:H13','A17:H17'],[24,56,18,18,18,18,18,18],{y:2,topLeft:'A3'});
      const parts=['Boldr_Filtered_Strengths_Matrix',selected.statuses.size?[...selected.statuses].join('-'):'All_Profiles',selected.locations.size?[...selected.locations].join('-'):'All_Locations',selected.departments.size?[...selected.departments].join('-'):'All_Departments'].map(v=>String(v).replace(/[^a-z0-9]+/gi,'_'));
      await excel.downloadWorkbook({sheets:[{name:'Report Summary',xml:summaryXml},{name:'Filtered Matrix',xml:matrixXml}],stylesXml,filename:parts.join('_')+'.xlsx'});
    }catch(error){console.error('Filtered matrix export failed',error);alert('The filtered Matrix report could not be generated. Please try again.');}
    finally{if(button){button.disabled=false;button.textContent=original;}}
  }

  function renderMatrix(rows){
    if(!rows.length){matrix.innerHTML='';return;}
    const totalPages=Math.max(1,Math.ceil(rows.length/MATRIX_PAGE_SIZE));
    matrixPage=Math.min(Math.max(1,matrixPage),totalPages);
    const start=(matrixPage-1)*MATRIX_PAGE_SIZE,end=Math.min(start+MATRIX_PAGE_SIZE,rows.length),pageRows=rows.slice(start,end);
    const groups=Object.entries(domains);
    const groupHead=groups.map(([name,info])=>`<th colspan="${info.themes.length}" style="--domain:${info.color}">${esc(name)}</th>`).join('');
    const themeHead=groups.flatMap(([name,info])=>info.themes.map(t=>`<th class="matrix-theme-head" style="--domain:${info.color}" title="${esc(t)}"><span>${esc(t)}</span></th>`)).join('');
    const body=pageRows.map((e,i)=>{
      const href=`profile.html?id=${encodeURIComponent(e.id)}&from=${encodeURIComponent(returnUrl())}`;
      return `<tr><td class="matrix-row-no">${start+i+1}</td><td class="matrix-name"><a href="${href}">${esc(e.name)}</a></td><td>${esc(e.role||'Role not listed')}</td><td>${esc(e.department||'Department not listed')}</td><td>${esc(e.location||'Location not listed')}</td><td><span class="matrix-status ${e.status==='Active'?'active':'inactive'}">${esc(e.status)}</span></td>${groups.flatMap(([name,info])=>info.themes.map(t=>rankCell(e,t))).join('')}</tr>`;
    }).join('');
    const pageButtons=Array.from({length:totalPages},(_,i)=>i+1).filter(p=>totalPages<=7||p===1||p===totalPages||Math.abs(p-matrixPage)<=1);
    let last=0;const pages=pageButtons.map(p=>{const gap=last&&p-last>1?'<span class="matrix-page-gap">…</span>':'';last=p;return `${gap}<button type="button" data-matrix-page="${p}" class="${p===matrixPage?'is-active':''}" aria-current="${p===matrixPage?'page':'false'}">${p}</button>`;}).join('');
    matrix.innerHTML=`<div class="matrix-intro"><div><p class="eyebrow">Filtered matrix</p><h2>${rows.length} profiles · 34 themes</h2><p>Showing ${MATRIX_PAGE_SIZE} profiles per page. Rank 1 receives the strongest domain emphasis; rank 10 fades toward the background.</p></div><div class="matrix-intro-actions"><button class="matrix-download" type="button" data-download-matrix>Download filtered matrix ↓</button><span>Scroll horizontally →</span></div></div><div class="directory-matrix-wrap"><table class="directory-matrix directory-matrix-v13"><thead><tr><th colspan="6" class="matrix-meta-group">Profile context</th>${groupHead}</tr><tr><th>#</th><th>Name</th><th>Job title</th><th>Team / division</th><th>Location</th><th>Status</th>${themeHead}</tr></thead><tbody>${body}</tbody></table></div><div class="matrix-pagination"><span>Rows ${start+1}–${end} of ${rows.length}</span><div class="matrix-page-controls"><button type="button" data-matrix-prev ${matrixPage===1?'disabled':''}>← Previous</button>${pages}<button type="button" data-matrix-next ${matrixPage===totalPages?'disabled':''}>Next →</button></div><span>${MATRIX_PAGE_SIZE} profiles per page</span></div>`;
    matrix.querySelector('[data-download-matrix]')?.addEventListener('click',event=>downloadFilteredMatrix(rows,event.currentTarget));
    matrix.querySelectorAll('[data-matrix-page]').forEach(btn=>btn.addEventListener('click',()=>{matrixPage=Number(btn.dataset.matrixPage);render();document.getElementById('directoryResults')?.scrollIntoView({block:'start'});}));
    matrix.querySelector('[data-matrix-prev]')?.addEventListener('click',()=>{if(matrixPage>1){matrixPage--;render();document.getElementById('directoryResults')?.scrollIntoView({block:'start'});}});
    matrix.querySelector('[data-matrix-next]')?.addEventListener('click',()=>{if(matrixPage<totalPages){matrixPage++;render();document.getElementById('directoryResults')?.scrollIntoView({block:'start'});}});
  }

  function updateResultsCopy(rows){
    count.textContent=`Showing ${rows.length} of ${employees.length} ${employees.length===1?'profile':'profiles'}`;
    const parts=[];
    if(selected.strengths.size)parts.push(`${selected.strengths.size} strength ${selected.strengths.size===1?'filter':'filters'}`);
    if(selected.domains.size)parts.push(`${selected.domains.size} domain ${selected.domains.size===1?'filter':'filters'}`);
    if(selected.departments.size)parts.push(`${selected.departments.size} ${selected.departments.size===1?'department':'departments'}`);
    if(selected.locations.size)parts.push(`${selected.locations.size} ${selected.locations.size===1?'location':'locations'}`);
    scope.textContent=parts.length?`Current view: ${parts.join(' · ')}.`:'Active profiles are shown by default. Historical inactive profiles remain available through Status.';
  }
  function renderView(rows){
    document.querySelectorAll('[data-directory-view]').forEach(button=>{const active=button.dataset.directoryView===viewMode;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
    const matrixHelper=$('matrixViewHelper');
    if(matrixHelper) matrixHelper.hidden=viewMode!=='matrix';
    if(viewMode==='matrix'){
      grid.hidden=true;matrix.hidden=false;renderMatrix(rows);
    }else{
      matrix.hidden=true;grid.hidden=false;
      grid.innerHTML=rows.length?rows.map(card).join(''):`<div class="empty-state"><h2>No profiles match these filters.</h2><p>Remove one or more criteria or reset the filters to broaden the directory.</p><button type="button" id="emptyReset">Reset filters</button></div>`;
      $('emptyReset')?.addEventListener('click',resetFilters);
    }
  }
  function render(){
    rebuildOptions(); updateBadges(); renderActiveFilters();
    const rows=filteredRows(); updateResultsCopy(rows); renderView(rows); syncUrl();
  }
  function resetFilters(){
    selected.domains.clear();selected.strengths.clear();selected.departments.clear();selected.locations.clear();selected.statuses=new Set(['Active']);setSearch('');viewMode='cards';matrixPage=1;render();
  }

  searchMobile.addEventListener('input',()=>{searchDesktop.value=searchMobile.value;resetMatrixPage();render();});
  searchDesktop.addEventListener('input',()=>{searchMobile.value=searchDesktop.value;resetMatrixPage();render();});
  $('clearFilters').addEventListener('click',resetFilters);
  document.querySelectorAll('[data-directory-view]').forEach(button=>button.addEventListener('click',()=>{viewMode=button.dataset.directoryView;matrixPage=1;render();}));
  mobileToggle.addEventListener('click',()=>{const open=document.body.classList.toggle('mobile-filters-open');mobileToggle.setAttribute('aria-expanded',String(open));});
  document.addEventListener('click',event=>{
    document.querySelectorAll('.filter-pop[open]').forEach(details=>{if(!details.contains(event.target))details.removeAttribute('open');});
  });
  render();
  if(location.hash==='#directoryResults') requestAnimationFrame(()=>document.getElementById('directoryResults')?.scrollIntoView({block:'start'}));
})();
