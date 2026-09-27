(function(){
  const data=window.BOLDR_STRENGTHS_DATA;
  const F=window.BoldrFilterUtils;
  if(!data||!F) return;
  const {employees,domains,themeOrder,themeLinks}=data;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const uniq=arr=>[...new Set(arr.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
  const pct=(n,d)=>d?Math.round(n/d*100):0;
  const selectedLocations=new Set(), selectedDepartments=new Set();
  const status=$('insightStatus'), context=$('insightsContext'), themeList=$('themeRankList'), heatmap=$('locationHeatmap');
  const analytical=$('insightsAnalyticalContent'), emptyState=$('insightsEmpty'), emptyReset=$('insightsEmptyReset'), detailPanel=$('locationDetail'), locationGrid=$('locationAnalysisGrid');
  const topButtons=[...document.querySelectorAll('[data-topn]')];
  const locationOptions=$('insightLocationOptions'), departmentOptions=$('insightDepartmentOptions');
  let topN=10;
  let detailState=null;

  const domainGuides={
    'Executing':'https://www.gallup.com/cliftonstrengths/en/252086/executing-domain.aspx',
    'Influencing':'https://www.gallup.com/cliftonstrengths/en/252089/influencing-domain.aspx',
    'Relationship Building':'https://www.gallup.com/cliftonstrengths/en/252083/relationship-building-domain.aspx',
    'Strategic Thinking':'https://www.gallup.com/cliftonstrengths/en/252080/strategic-thinking-domain.aspx'
  };
  const peopleIcon=`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.2"/><path d="M3.8 19c.5-3.2 2.4-5 5.2-5s4.8 1.8 5.3 5M14.7 14.5c2.8.1 4.6 1.6 5 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  const themeIcon=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.9 5 5.1 1.9-5.1 1.9L12 17l-1.9-5.2L5 9.9l5.1-1.9L12 3Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
  const domainIcon=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 4 8 4-8 4-8-4 8-4Zm-7 8 7 3.5 7-3.5M5 16l7 3.5 7-3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  function allLocations(){return F.uniqueValues(employees,'location');}
  function allDepartments(){return F.uniqueValues(employees,'department');}
  function themeSlice(e){return (e.strengths||[]).slice(0,topN);}
  function hasDepthData(e){return (e.strengths||[]).length>=topN;}
  function analysisRows(rows){return rows.filter(hasDepthData);}
  function coverage(rows){const eligible=analysisRows(rows);return {eligible,total:rows.length,missing:rows.length-eligible.length};}
  function themeDomain(theme){for(const [name,info] of Object.entries(domains))if(info.themes.includes(theme))return name;return '';}
  function themeColor(theme){return domains[themeDomain(theme)]?.color||'#75808A';}
  function filtered(opts={}){
    return employees.filter(e=>F.matchesPopulation(e,{
      locations:opts.ignoreLocation?new Set():selectedLocations,
      departments:opts.ignoreDepartment?new Set():selectedDepartments,
      statuses:opts.ignoreStatus||!status.value?new Set():new Set([status.value])
    }));
  }
  function themeCounts(rows){
    const m=Object.fromEntries(themeOrder.map(t=>[t,0]));
    analysisRows(rows).forEach(e=>{const seen=new Set(themeSlice(e).map(s=>s.theme));seen.forEach(t=>{if(t in m)m[t]++;});});
    return m;
  }
  function rankedThemes(rows,limit=34){return Object.entries(themeCounts(rows)).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,limit);}
  function domainSlotCounts(rows){
    const counts=Object.fromEntries(Object.keys(domains).map(d=>[d,0]));let total=0;
    analysisRows(rows).forEach(e=>themeSlice(e).forEach(s=>{counts[s.domain]=(counts[s.domain]||0)+1;total++;}));
    return {counts,total};
  }
  function domainProfileCounts(rows){
    const counts=Object.fromEntries(Object.keys(domains).map(d=>[d,0]));
    analysisRows(rows).forEach(e=>{const seen=new Set(themeSlice(e).map(s=>s.domain));seen.forEach(d=>counts[d]++);});
    return counts;
  }
  function matrixBaseRows(){return filtered({ignoreLocation:true});}
  function visibleMatrixLocations(){
    const base=matrixBaseRows(), available=uniq(base.map(e=>e.location));
    return selectedLocations.size?[...selectedLocations].filter(v=>available.includes(v)).sort((a,b)=>a.localeCompare(b)):available;
  }
  function matrixThemeList(rows){const limit=Number($('matrixRows').value||10);return rankedThemes(rows,limit).map(x=>x[0]);}
  function heatClass(p){if(p<20)return'h0';if(p<40)return'h1';if(p<60)return'h2';if(p<80)return'h3';return'h4';}

  function labelForSet(set,singular,plural,allLabel){if(!set.size)return allLabel;if(set.size===1)return [...set][0];return `${set.size} ${plural}`;}
  function renderMultiOptions(){
    const locationBase=filtered({ignoreLocation:true}), departmentBase=filtered({ignoreDepartment:true});
    locationOptions.innerHTML=allLocations().map(v=>{
      const amount=locationBase.filter(e=>e.location===v).length,checked=selectedLocations.has(v);
      return `<label class="insights-check-row${!amount&&!checked?' zero-option':''}"><input type="checkbox" data-insight-location="${esc(v)}" ${checked?'checked':''} ${!amount&&!checked?'disabled':''}><span>${esc(v)}</span><b>${amount}</b></label>`;
    }).join('');
    departmentOptions.innerHTML=allDepartments().map(v=>{
      const amount=departmentBase.filter(e=>e.department===v).length,checked=selectedDepartments.has(v);
      return `<label class="insights-check-row${!amount&&!checked?' zero-option':''}"><input type="checkbox" data-insight-department="${esc(v)}" ${checked?'checked':''} ${!amount&&!checked?'disabled':''}><span>${esc(v)}</span><b>${amount}</b></label>`;
    }).join('');
    $('insightLocationLabel').textContent=labelForSet(selectedLocations,'location','locations','All locations');
    $('insightDepartmentLabel').textContent=labelForSet(selectedDepartments,'department','departments','All departments');
    $('insightLocationBadge').textContent=selectedLocations.size;$('insightDepartmentBadge').textContent=selectedDepartments.size;
    $('insightLocationFilter').classList.toggle('has-selection',selectedLocations.size>0);$('insightDepartmentFilter').classList.toggle('has-selection',selectedDepartments.size>0);
    locationOptions.querySelectorAll('[data-insight-location]').forEach(input=>input.addEventListener('change',()=>{input.checked?selectedLocations.add(input.dataset.insightLocation):selectedLocations.delete(input.dataset.insightLocation);detailState=null;render();}));
    departmentOptions.querySelectorAll('[data-insight-department]').forEach(input=>input.addEventListener('change',()=>{input.checked?selectedDepartments.add(input.dataset.insightDepartment):selectedDepartments.delete(input.dataset.insightDepartment);detailState=null;render();}));
  }

  function applyQuery(){
    const p=new URLSearchParams(location.search);
    F.readSet(p,'location').forEach(v=>selectedLocations.add(v));F.readSet(p,'department').forEach(v=>selectedDepartments.add(v));
    if(['Active','Inactive'].includes(p.get('status')))status.value=p.get('status');
    const n=Number(p.get('topn'));if(n===5||n===10)topN=n;
    const matrix=Number(p.get('matrix'));if([10,15,34].includes(matrix))$('matrixRows').value=String(matrix);
    topButtons.forEach(b=>b.classList.toggle('is-active',Number(b.dataset.topn)===topN));
  }
  function stateParams(){
    const p=new URLSearchParams();F.appendValues(p,'location',selectedLocations);F.appendValues(p,'department',selectedDepartments);if(status.value)p.set('status',status.value);p.set('topn',String(topN));p.set('matrix',$('matrixRows').value);return p;
  }
  function syncUrl(){history.replaceState(null,'',`${location.pathname}?${stateParams().toString()}${location.hash||''}`);}
  applyQuery();

  function gridUrl(extra={}){
    const p=new URLSearchParams();
    const locations=extra.locations||[...selectedLocations], departments=extra.departments||[...selectedDepartments];
    F.appendValues(p,'location',locations);F.appendValues(p,'department',departments);
    p.set('status',status.value||'All');
    if(extra.strength)p.append('strength',extra.strength);
    return `grid.html?${p.toString()}#directoryResults`;
  }

  function renderContext(rows){
    const cov=coverage(rows),den=cov.eligible.length;
    const ranked=rankedThemes(rows,34), maxTheme=ranked[0]?.[1]||0,themeTies=ranked.filter(([,n])=>n===maxTheme&&n>0),themePct=pct(maxTheme,den);
    const themeName=!den?'No data':themeTies.length===1?themeTies[0][0]:`${themeTies.length} themes tied`, themeAccent=themeTies.length===1?themeColor(themeTies[0][0]):'#FF6B00';
    const themeHref=themeTies.length===1?(themeLinks?.[themeTies[0][0]]||'https://www.gallup.com/cliftonstrengths/en/253715/home.aspx'):'https://www.gallup.com/cliftonstrengths/en/253715/home.aspx';
    const dc=domainSlotCounts(rows),entries=Object.entries(dc.counts).sort((a,b)=>b[1]-a[1]),maxDomain=entries[0]?.[1]||0,domainTies=entries.filter(([,n])=>n===maxDomain&&n>0),domainPct=dc.total?Math.round(maxDomain/dc.total*100):0;
    const domainName=!den?'No data':domainTies.length===1?domainTies[0][0]:`${domainTies.length} domains tied`,domainAccent=domainTies.length===1?domains[domainTies[0][0]].color:'#252D49';
    const domainHref=domainTies.length===1?domainGuides[domainTies[0][0]]:'https://www.gallup.com/cliftonstrengths/en/253736/cliftonstrengths-domains.aspx';
    const chips=[];
    selectedLocations.forEach(v=>chips.push(`<button type="button" data-context-remove="location" data-value="${esc(v)}">${esc(v)} <span>×</span></button>`));
    selectedDepartments.forEach(v=>chips.push(`<button type="button" data-context-remove="department" data-value="${esc(v)}">${esc(v)} <span>×</span></button>`));
    if(status.value)chips.push(`<button type="button" data-context-remove="status" data-value="${esc(status.value)}">${esc(status.value)} <span>×</span></button>`);
    const defaultContext=!chips.length?'<span class="context-neutral">All profiles · All locations · All departments</span>':'';
    const coverageCopy=den===rows.length?`${den} profiles have Top ${topN} data`:`${den} of ${rows.length} profiles have Top ${topN} data`;
    context.innerHTML=`
      <div class="context-primary context-card context-primary-v12" style="--context-accent:#FF6B00"><span class="context-icon">${peopleIcon}</span><div class="context-copy"><span class="context-label">Profiles in view</span><strong>${rows.length}</strong><div class="context-filter-chips">${defaultContext}${chips.join('')}<span class="context-mode">Top ${topN}</span>${chips.length?'<button type="button" class="context-reset" data-context-reset>Clear filters</button>':''}</div><div class="context-primary-actions"><small>${coverageCopy}. Remove a filter here to widen the analysis.</small><a href="${gridUrl()}">Open ${rows.length} matching profile${rows.length===1?'':'s'} in Explore People →</a></div></div></div>
      <div class="context-insight context-card" style="--context-accent:${themeAccent}"><span class="context-icon">${themeIcon}</span><div class="context-copy"><span>Most represented theme</span><strong>${esc(themeName)}</strong><small>${den?`${themePct}% of profiles with Top ${topN} data`:'No eligible profiles at this depth'}</small><a class="context-learning-link" href="${themeHref}" target="_blank" rel="noopener">${themeTies.length===1?`View ${esc(themeTies[0][0])} at Gallup ↗`:'Explore all 34 themes at Gallup ↗'}</a></div></div>
      <div class="context-insight context-card" style="--context-accent:${domainAccent}"><span class="context-icon">${domainIcon}</span><div class="context-copy"><span>Most represented domain</span><strong>${esc(domainName)}</strong><small>${domainPct}% of represented Top ${topN} theme positions</small><a class="context-learning-link" href="${domainHref}" target="_blank" rel="noopener">${domainTies.length===1?`View ${esc(domainTies[0][0])} at Gallup ↗`:'Explore the four domains at Gallup ↗'}</a></div></div>`;
    context.querySelectorAll('[data-context-remove]').forEach(btn=>btn.addEventListener('click',()=>{const value=btn.dataset.value;if(btn.dataset.contextRemove==='location')selectedLocations.delete(value);if(btn.dataset.contextRemove==='department')selectedDepartments.delete(value);if(btn.dataset.contextRemove==='status')status.value='';detailState=null;render();}));
    context.querySelector('[data-context-reset]')?.addEventListener('click',resetFilters);
  }

  function renderDomainComposition(rows){
    const eligible=analysisRows(rows),slots=domainSlotCounts(rows),profiles=domainProfileCounts(rows),circ=2*Math.PI*72;let offset=0;
    $('domainScopeLabel').textContent=eligible.length===rows.length?`${rows.length} profile${rows.length===1?'':'s'} · Top ${topN}`:`${eligible.length} of ${rows.length} profiles · Top ${topN} data`;$('domainDepthCopy').textContent=topN;
    const circles=[];const columns=[];
    for(const [domain,info] of Object.entries(domains)){
      const share=slots.total?slots.counts[domain]/slots.total:0,len=share*circ;
      circles.push(`<circle class="domain-donut-segment" tabindex="0" data-domain="${esc(domain)}" data-share="${Math.round(share*100)}" data-profiles="${profiles[domain]}" cx="92" cy="92" r="72" fill="none" stroke="${info.color}" stroke-width="32" stroke-dasharray="${len} ${circ-len}" stroke-dashoffset="-${offset}" transform="rotate(-90 92 92)"/>`);offset+=len;
      const themeCountsForDomain=info.themes.map(t=>[t,eligible.filter(e=>themeSlice(e).some(s=>s.theme===t)).length]).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,3);
      columns.push(`<div class="domain-summary-column" style="--domain:${info.color}"><div class="domain-summary-title"><i></i><strong>${esc(domain)}</strong></div><b>${Math.round(share*100)}%</b><span>${profiles[domain]} of ${eligible.length} contributing profile${eligible.length===1?'':'s'}</span><small>${slots.counts[domain]} represented theme positions</small><div class="domain-top-themes">${themeCountsForDomain.map(([t,n])=>`<span>${esc(t)} <b>${n}</b></span>`).join('')}</div></div>`);
    }
    $('domainCompositionViz').innerHTML=`<div class="domain-donut-area"><div class="domain-donut-wrap"><svg viewBox="0 0 184 184" role="img" aria-label="Domain composition donut chart"><circle cx="92" cy="92" r="72" fill="none" stroke="#EEF0F3" stroke-width="32"/>${circles.join('')}</svg><div class="domain-donut-center"><strong>${eligible.length}</strong><span>profiles<br>contributing</span></div><div class="domain-donut-tooltip" id="domainDonutTooltip" hidden></div></div><div class="domain-summary-grid">${columns.join('')}</div></div>`;
    const tip=$('domainDonutTooltip');
    function showTip(el){const domain=el.dataset.domain,profilesCount=Number(el.dataset.profiles),share=el.dataset.share;tip.innerHTML=`<strong><i style="background:${domains[domain].color}"></i>${esc(domain)}</strong><b>${profilesCount} of ${eligible.length} contributing profiles</b><span>have at least one Top ${topN} theme in this domain.</span><small>${share}% of represented theme positions · ${rows.length} profiles in full scope</small>`;tip.hidden=false;}
    $('domainCompositionViz').querySelectorAll('.domain-donut-segment').forEach(el=>{el.addEventListener('mouseenter',()=>showTip(el));el.addEventListener('focus',()=>showTip(el));el.addEventListener('mouseleave',()=>tip.hidden=true);el.addEventListener('blur',()=>tip.hidden=true);});
  }

  function renderThemes(rows){
    const eligible=analysisRows(rows),den=eligible.length,ranked=rankedThemes(rows,10);let prior=null,rank=0;
    $('themeRepresentationCopy').textContent=`Most represented themes among profiles with available Top ${topN} data.`;
    if(!den){themeList.innerHTML=`<div class="analysis-data-empty"><strong>No profiles in this scope have enough Top ${topN} data.</strong><span>Change the theme depth or widen the filters to continue the analysis.</span></div>`;return;}
    themeList.innerHTML=ranked.map(([theme,n],i)=>{if(n!==prior)rank=i+1;prior=n;const p=pct(n,den);return `<a class="theme-rank-row" href="${gridUrl({strength:theme})}" title="${n} of ${den} contributing profiles"><span class="rank-no">${rank}</span><span class="rank-theme"><i style="background:${themeColor(theme)}"></i>${esc(theme)}</span><span class="rank-bar"><i style="width:${p}%;background:${themeColor(theme)}"></i></span><strong>${p}%</strong></a>`;}).join('');
  }

  function renderStandout(rows){
    const list=$('standoutList'),title=$('standoutTitle'),copy=$('standoutCopy');
    if(!list||!title||!copy)return;
    const eligible=analysisRows(rows),den=eligible.length,hasGrouping=selectedLocations.size>0||selectedDepartments.size>0;
    const card=$('standoutCard');
    card?.classList.toggle('is-coverage',!hasGrouping);
    if(!hasGrouping){
      const counts=themeCounts(rows),coverageCount=Object.values(counts).filter(n=>n>0).length,forty=Object.values(counts).filter(n=>den&&n/den>=.40).length,twenty=Object.values(counts).filter(n=>den&&n/den>=.20).length;
      title.textContent='Theme coverage';copy.textContent=`Coverage across profiles with available Top ${topN} data.`;
      list.innerHTML=`<div class="coverage-primary-v17"><span class="coverage-icon-v17 coverage-icon-layers" aria-hidden="true"><i></i><i></i><i></i></span><div class="coverage-primary-copy"><strong>${coverageCount}<span> of 34</span></strong><b>themes represented</b><small>${den} contributing profile${den===1?'':'s'}</small></div></div><div class="coverage-stat-grid-v17"><div class="coverage-stat-v17"><span class="coverage-icon-v17 coverage-icon-people" aria-hidden="true"><i></i><i></i><i></i></span><div><strong>${forty}</strong><b>themes</b><p>Appear in at least <em>40%</em> of contributing profiles.</p></div></div><div class="coverage-stat-v17"><span class="coverage-icon-v17 coverage-icon-bars" aria-hidden="true"><i></i><i></i><i></i></span><div><strong>${twenty}</strong><b>themes</b><p>Appear in at least <em>20%</em> of contributing profiles.</p></div></div></div><div class="coverage-note-v17"><span aria-hidden="true">ⓘ</span><small>${den} of ${rows.length} profiles contribute to this Top ${topN} analysis.</small></div>`;
      return;
    }
    const baselineRows=filtered({ignoreLocation:true,ignoreDepartment:true}),baselineEligible=analysisRows(baselineRows),baseDen=baselineEligible.length,currentCounts=themeCounts(rows),baseCounts=themeCounts(baselineRows);
    const diffs=themeOrder.map(theme=>{const current=pct(currentCounts[theme]||0,den),base=pct(baseCounts[theme]||0,baseDen);return {theme,current,base,diff:current-base};}).filter(x=>x.diff>0).sort((a,b)=>b.diff-a.diff||b.current-a.current||a.theme.localeCompare(b.theme)).slice(0,4);
    title.textContent='What stands out in this view';copy.textContent=`Compared with the broader ${status.value||'All profiles'} population at Top ${topN}.`;
    if(!diffs.length){list.innerHTML=`<div class="standout-empty"><strong>No themes are more represented than the broader baseline.</strong><span>The current selection closely follows the wider pattern at this depth.</span></div>`;return;}
    list.innerHTML=diffs.map(x=>`<a class="standout-row" href="${gridUrl({strength:x.theme})}"><span class="standout-theme"><i style="background:${themeColor(x.theme)}"></i><strong>${esc(x.theme)}</strong></span><span class="standout-values"><b>${x.current}%</b><small>${x.base}% baseline</small></span><em>+${x.diff} pts</em></a>`).join('')+`<small class="standout-footnote">Baseline removes Location and Department filters while keeping Status and Top ${topN} constant.</small>`;
  }

  function renderHeatmap(rows){
    const base=matrixBaseRows(),locations=visibleMatrixLocations(),themes=matrixThemeList(filtered()),groups=Object.fromEntries(locations.map(l=>[l,base.filter(e=>e.location===l)]));
    heatmap.innerHTML=`<thead><tr><th>Theme</th>${locations.map(l=>`<th class="${selectedLocations.has(l)?'selected-location':''}"><button type="button" data-location-detail="${esc(l)}" aria-label="Open ${esc(l)} location detail">${esc(l)}</button></th>`).join('')}</tr></thead><tbody>${themes.map(theme=>`<tr><th><span class="heat-theme"><i style="background:${themeColor(theme)}"></i>${esc(theme)}</span></th>${locations.map(l=>{const all=groups[l]||[],g=analysisRows(all),n=g.filter(e=>themeSlice(e).some(s=>s.theme===theme)).length,p=g.length?n/g.length*100:0,display=g.length?`${Math.round(p)}%`:'—',heat=g.length?heatClass(p):'h-missing';return `<td class="${heat} ${selectedLocations.has(l)?'selected-location':''}" title="${g.length?`${esc(theme)} · ${esc(l)} · ${n} of ${g.length} profiles with Top ${topN} data · ${Math.round(p)}% · ${g.length} of ${all.length} profiles contribute`:`${esc(theme)} · ${esc(l)} · no profiles with Top ${topN} data in scope`}"><button type="button" data-cell-location="${esc(l)}" data-cell-theme="${esc(theme)}">${display}</button></td>`;}).join('')}</tr>`).join('')}</tbody>`;
    heatmap.querySelectorAll('[data-location-detail]').forEach(btn=>btn.addEventListener('click',()=>{detailState={type:'locations',locations:[btn.dataset.locationDetail]};renderLocationDetail(rows);}));
    heatmap.querySelectorAll('[data-cell-location]').forEach(btn=>btn.addEventListener('click',()=>{detailState={type:'cell',locations:[btn.dataset.cellLocation],theme:btn.dataset.cellTheme};renderLocationDetail(rows);}));
  }

  function compactGroupLabel(values,noun){const arr=[...values];if(!arr.length)return '';if(arr.length<=2)return arr.join(' + ');return `${arr[0]} + ${arr[1]} + ${arr.length-2} more`;}
  function effectiveDetailState(){
    if(detailState)return detailState;
    if(selectedLocations.size)return {type:'locations',locations:[...selectedLocations]};
    if(selectedDepartments.size>1)return {type:'departments',departments:[...selectedDepartments]};
    return null;
  }
  function domainMix(rows){const d=domainSlotCounts(rows);return Object.entries(domains).map(([name,info])=>({name,color:info.color,p:d.total?Math.round(d.counts[name]/d.total*100):0}));}
  function renderLocationDetail(allRows){
    const state=effectiveDetailState();
    if(!state){detailPanel.hidden=true;locationGrid.classList.remove('has-detail');return;}
    let rows=[],title='',eyebrow='',ctaLocations=[...selectedLocations],ctaDepartments=[...selectedDepartments],strength='';
    const base=filtered({ignoreLocation:true,ignoreDepartment:state.type==='departments'});
    if(state.type==='cell'){
      const loc=state.locations[0];rows=base.filter(e=>e.location===loc);const eligible=analysisRows(rows);strength=state.theme;const matching=eligible.filter(e=>themeSlice(e).some(s=>s.theme===strength));
      title=`${strength} in ${loc}`;eyebrow='Theme × location';ctaLocations=[loc];
      detailPanel.innerHTML=`<div class="location-detail-head"><button class="detail-back" type="button" data-detail-back>← Back to ${esc(loc)}</button><button class="detail-close" type="button" data-detail-close aria-label="Close detail">×</button></div><p class="eyebrow">${eyebrow}</p><h2>${esc(title)}</h2><div class="cell-detail-metrics"><div><strong>${matching.length}</strong><span>of ${eligible.length} profiles with Top ${topN} data</span></div><div><strong>${pct(matching.length,eligible.length)}%</strong><span>have ${esc(strength)} within Top ${topN}</span></div></div><p class="detail-support">${eligible.length} of ${rows.length} profiles in this location contribute to the calculation under the current filters.</p><a class="location-detail-cta" href="${gridUrl({locations:ctaLocations,departments:ctaDepartments,strength})}">View ${esc(loc)} profiles with ${esc(strength)} →</a>`;
    }else{
      if(state.type==='locations'){
        const locs=state.locations;rows=base.filter(e=>locs.includes(e.location));title=compactGroupLabel(locs,'locations');eyebrow=locs.length===1?'Location detail':`${locs.length} locations selected`;ctaLocations=locs;
      }else{
        const deps=state.departments;rows=employees.filter(e=>(!status.value||e.status===status.value)&&deps.includes(e.department)&&(!selectedLocations.size||selectedLocations.has(e.location)));title=compactGroupLabel(deps,'departments');eyebrow=`${deps.length} departments selected`;ctaDepartments=deps;
      }
      const eligible=analysisRows(rows),top=rankedThemes(rows,5),mix=domainMix(rows);
      detailPanel.innerHTML=`<div class="location-detail-head"><div><p class="eyebrow">${esc(eyebrow)}</p><h2>${esc(title)}</h2><span>${rows.length} profile${rows.length===1?'':'s'} in the current scope · ${eligible.length} contribute Top ${topN} data</span></div><button class="detail-close" type="button" data-detail-close aria-label="Close detail">×</button></div><h3>Top themes ${state.type==='locations'&&state.locations.length===1?`in ${esc(state.locations[0])}`:'across this selection'}</h3><div class="detail-theme-list">${top.map(([theme,n],i)=>{const p=pct(n,eligible.length);return `<div><span>${i+1}</span><i style="background:${themeColor(theme)}"></i><strong>${esc(theme)}</strong><b><em style="width:${p}%;background:${themeColor(theme)}"></em></b><small>${p}%</small></div>`;}).join('')}</div><h3>Domain composition</h3><div class="detail-domain-bar">${mix.map(d=>`<i style="width:${d.p}%;background:${d.color}" title="${esc(d.name)} ${d.p}%"></i>`).join('')}</div><div class="detail-domain-legend">${mix.map(d=>`<span><i style="background:${d.color}"></i><b>${d.p}%</b> ${esc(d.name)}</span>`).join('')}</div><div class="detail-current-scope"><strong>Current scope</strong>${[status.value||'All profiles',`Top ${topN}`,...selectedDepartments].slice(0,4).map(v=>`<span>${esc(v)}</span>`).join('')}</div><a class="location-detail-cta" href="${gridUrl({locations:ctaLocations,departments:ctaDepartments})}">View these ${rows.length} profiles →</a>`;
    }
    detailPanel.hidden=false;locationGrid.classList.add('has-detail');
    detailPanel.querySelector('[data-detail-close]')?.addEventListener('click',()=>{detailState=null;detailPanel.hidden=true;locationGrid.classList.remove('has-detail');});
    detailPanel.querySelector('[data-detail-back]')?.addEventListener('click',()=>{detailState={type:'locations',locations:[state.locations[0]]};renderLocationDetail(allRows);});
  }

  function render(){
    syncUrl();renderMultiOptions();const rows=filtered();renderContext(rows);const hasRows=rows.length>0;emptyState.hidden=hasRows;analytical.hidden=!hasRows;if(!hasRows)return;
    renderDomainComposition(rows);renderThemes(rows);renderStandout(rows);renderHeatmap(rows);renderLocationDetail(rows);
  }
  function resetFilters(){selectedLocations.clear();selectedDepartments.clear();status.value='';topN=10;detailState=null;topButtons.forEach(b=>b.classList.toggle('is-active',b.dataset.topn==='10'));$('matrixRows').value='10';render();}

  status.addEventListener('change',()=>{detailState=null;render();});$('matrixRows').addEventListener('change',render);
  topButtons.forEach(btn=>btn.addEventListener('click',()=>{topN=Number(btn.dataset.topn);topButtons.forEach(b=>b.classList.toggle('is-active',b===btn));detailState=null;render();}));
  $('insightsClear').addEventListener('click',resetFilters);emptyReset.addEventListener('click',resetFilters);
  document.addEventListener('click',event=>{document.querySelectorAll('.insights-multi-filter[open]').forEach(d=>{if(!d.contains(event.target))d.removeAttribute('open');});});

  // ---------------- Excel export (self-contained XLSX via JSZip) ----------------
  const xmlEsc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  function colName(n){let s='';while(n){let r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26);}return s;}
  function cell(ref,value,style=0){if(typeof value==='number'&&Number.isFinite(value))return `<c r="${ref}" s="${style}"><v>${value}</v></c>`;return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(value)}</t></is></c>`;}
  function rowXml(r,cells){return `<row r="${r}">${cells.join('')}</row>`;}
  function sheetXml(rows,merges=[],widths=[]){const excel=window.BoldrExcelUtils;if(!excel?.worksheetXml)throw new Error('Shared Excel worksheet builder is unavailable.');return excel.worksheetXml({rows,merges,widths});}
  const stylesXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="5"><font><sz val="11"/><name val="Inter"/></font><font><b/><sz val="24"/><color rgb="FFFF6B00"/><name val="Inter"/></font><font><b/><sz val="12"/><color rgb="FFFFFFFF"/><name val="Inter"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Inter"/></font><font><b/><sz val="11"/><color rgb="FF252D49"/><name val="Inter"/></font></fonts><fills count="13"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF252D49"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFF6B00"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF8C4CCF"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2D8CFF"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF22A86A"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFAF7F2"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8EBF0"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFCDD5E0"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF9EADC2"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF5E6F8F"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color rgb="FFE3DED6"/></left><right style="thin"><color rgb="FFE3DED6"/></right><top style="thin"><color rgb="FFE3DED6"/></top><bottom style="thin"><color rgb="FFE3DED6"/></bottom></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="15"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="0" fillId="12" borderId="1" xfId="0" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="3" fillId="6" borderId="1" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="4" fillId="7" borderId="1" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="4" fillId="8" borderId="1" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="4" fillId="9" borderId="1" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="4" fillId="10" borderId="1" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="11" borderId="1" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="4" fillId="12" borderId="1" xfId="0" applyFill="1" applyFont="1"/></cellXfs></styleSheet>`;
  function domainStyle(d){return {'Executing':5,'Influencing':6,'Relationship Building':7,'Strategic Thinking':8}[d]||4;}
  function heatStyle(p){return p<20?9:p<40?10:p<60?11:p<80?12:13;}
  function workbookParts(rows){
    const eligible=analysisRows(rows),den=eligible.length,ranked=rankedThemes(rows,34),dc=domainSlotCounts(rows),locs=visibleMatrixLocations(),matrixThemes=matrixThemeList(rows),profileDomainCounts=domainProfileCounts(rows);
    const topTheme=ranked[0]?`${ranked[0][0]} ${pct(ranked[0][1],den)}%`:'No data',entries=Object.entries(dc.counts).sort((a,b)=>b[1]-a[1]),topDomain=entries[0]&&dc.total?`${entries[0][0]} ${Math.round(entries[0][1]/dc.total*100)}%`:'No data';
    const detail=effectiveDetailState();
    const detailLabel=!detail?'None':detail.type==='cell'?`${detail.theme} in ${detail.locations[0]}`:detail.type==='locations'?`Location: ${detail.locations.join(', ')}`:`Departments: ${detail.departments.join(', ')}`;
    const summary=[rowXml(1,[cell('A1','Boldr.',1)]),rowXml(3,[cell('A3','STRENGTHS INSIGHTS • EXCEL REPORT',2)]),rowXml(5,[cell('A5','Profiles in view',3),cell('B5',rows.length,14)]),rowXml(6,[cell('A6',`Profiles with Top ${topN} data`,14),cell('B6',den,4)]),rowXml(7,[cell('A7','Locations',14),cell('B7',selectedLocations.size?[...selectedLocations].join(', '):'All locations',4)]),rowXml(8,[cell('A8','Departments',14),cell('B8',selectedDepartments.size?[...selectedDepartments].join(', '):'All departments',4)]),rowXml(9,[cell('A9','Status',14),cell('B9',status.value||'All profiles',4)]),rowXml(10,[cell('A10','Theme depth',14),cell('B10',`Top ${topN}`,4)]),rowXml(11,[cell('A11','Location rows shown',14),cell('B11',$('matrixRows').value==='34'?'All 34':`Top ${$('matrixRows').value}`,4)]),rowXml(12,[cell('A12','Focused detail',14),cell('B12',detailLabel,4)]),rowXml(14,[cell('A14','Most represented theme',3),cell('B14',topTheme,4)]),rowXml(15,[cell('A15','Most represented domain',3),cell('B15',topDomain,4)]),rowXml(17,[cell('A17','DOMAIN COMPOSITION',2)])];
    let rr=18;Object.keys(domains).forEach(d=>{summary.push(rowXml(rr,[cell(`A${rr}`,d,domainStyle(d)),cell(`B${rr}`,dc.total?`${Math.round(dc.counts[d]/dc.total*100)}%`:'0%',4),cell(`C${rr}`,`${dc.counts[d]} represented theme positions`,4),cell(`D${rr}`,`${profileDomainCounts[d]} of ${den} contributing profiles`,4)]));rr++;});
    summary.push(rowXml(23,[cell('A23','INTERPRETATION NOTE',2)]),rowXml(24,[cell('A24',`Population counts include every filtered profile. Percentages use only profiles with enough data for Top ${topN} analysis.`,4)]));

    const themes=[rowXml(1,[cell('A1','Boldr. | Theme Representation',1)]),rowXml(3,[cell('A3','Theme',3),cell('B3','Domain',3),cell('C3','Profiles represented',3),cell('D3',`% of ${den} contributing profiles`,3)])];ranked.forEach(([t,n],i)=>{const r=4+i,d=themeDomain(t);themes.push(rowXml(r,[cell(`A${r}`,t,4),cell(`B${r}`,d,domainStyle(d)),cell(`C${r}`,n,4),cell(`D${r}`,`${pct(n,den)}%`,4)]));});

    const locRows=[rowXml(1,[cell('A1','Boldr. | Strengths by Location',1)]),rowXml(2,[cell('A2',`Percentages use profiles with available Top ${topN} data.`,4)]),rowXml(4,[cell('A4','Theme',3),...locs.map((l,i)=>cell(`${colName(i+2)}4`,l,3))])],base=matrixBaseRows(),groups=Object.fromEntries(locs.map(l=>[l,base.filter(e=>e.location===l)]));matrixThemes.forEach((theme,i)=>{const r=5+i,cells=[cell(`A${r}`,theme,4)];locs.forEach((l,j)=>{const all=groups[l],g=analysisRows(all),n=g.filter(e=>themeSlice(e).some(s=>s.theme===theme)).length,p=g.length?n/g.length*100:0;cells.push(cell(`${colName(j+2)}${r}`,g.length?`${Math.round(p)}% (${n}/${g.length})`:'No data',g.length?heatStyle(p):4));});locRows.push(rowXml(r,cells));});

    const baselineRows=filtered({ignoreLocation:true,ignoreDepartment:true}),baselineEligible=analysisRows(baselineRows),baseDen=baselineEligible.length,currentCounts=themeCounts(rows),baseCounts=themeCounts(baselineRows),hasGrouping=selectedLocations.size>0||selectedDepartments.size>0;
    const standout=[rowXml(1,[cell('A1','Boldr. | What Stands Out in This View',1)])];
    if(hasGrouping){
      standout.push(rowXml(3,[cell('A3','Theme',3),cell('B3','Current %',3),cell('C3','Baseline %',3),cell('D3','Difference (pts)',3)]));
      themeOrder.map(theme=>{const current=pct(currentCounts[theme]||0,den),base=pct(baseCounts[theme]||0,baseDen);return {theme,current,base,diff:current-base};}).filter(x=>x.diff>0).sort((a,b)=>b.diff-a.diff||b.current-a.current||a.theme.localeCompare(b.theme)).slice(0,10).forEach((x,i)=>{const r=4+i;standout.push(rowXml(r,[cell(`A${r}`,x.theme,domainStyle(themeDomain(x.theme))),cell(`B${r}`,`${x.current}%`,4),cell(`C${r}`,`${x.base}%`,4),cell(`D${r}`,`+${x.diff}`,4)]));});
      standout.push(rowXml(15,[cell('A15',`Baseline removes Location and Department filters while keeping ${status.value||'All profiles'} and Top ${topN}.`,4)]));
    }else{
      const counts=themeCounts(rows),coverageCount=Object.values(counts).filter(n=>n>0).length,forty=Object.values(counts).filter(n=>den&&n/den>=.40).length,twenty=Object.values(counts).filter(n=>den&&n/den>=.20).length;
      standout.push(rowXml(3,[cell('A3','Theme coverage',3),cell('B3',`${coverageCount} of 34 themes represented`,4)]),rowXml(4,[cell('A4','Themes in 40%+ of contributing profiles',14),cell('B4',forty,4)]),rowXml(5,[cell('A5','Themes in 20%+ of contributing profiles',14),cell('B5',twenty,4)]));
    }

    const prof=[rowXml(1,[cell('A1','Boldr. | Profiles in View',1)])],headers=['Profile','Job Title','Department','SBU','Location','Status','Cohort',...Array.from({length:topN},(_,i)=>`Top ${i+1}`),'Full 34 Report'];prof.push(rowXml(3,headers.map((h,i)=>cell(`${colName(i+1)}3`,h,3))));rows.forEach((e,i)=>{const r=4+i,cells=[cell(`A${r}`,e.name,4),cell(`B${r}`,e.role||'Not listed',4),cell(`C${r}`,e.department||'Not listed',4),cell(`D${r}`,e.sbu||'Not listed',4),cell(`E${r}`,e.location||'Not listed',4),cell(`F${r}`,e.status,4),cell(`G${r}`,e.cohort||'Not listed',4)];for(let k=0;k<topN;k++)cells.push(cell(`${colName(8+k)}${r}`,e.strengths[k]?.theme||'',4));cells.push(cell(`${colName(8+topN)}${r}`,e.full34ReportUrl||'',4));prof.push(rowXml(r,cells));});
    return [{name:'Report Summary',xml:sheetXml(summary,['A1:H2','A3:H3','A17:H17','A23:H23'],[24,40,30,28,18,18,18,18])},{name:'Theme Representation',xml:sheetXml(themes,[],[24,24,22,24])},{name:'What Stands Out',xml:sheetXml(standout,[],[28,18,18,20])},{name:'Strengths by Location',xml:sheetXml(locRows,[],[28,...locs.map(()=>20)])},{name:'Profiles in View',xml:sheetXml(prof,[],[26,28,24,20,16,14,14,...Array(topN).fill(18),48])}];
  }

  async function downloadXlsx(){
    const button=$('downloadReport');if(button.disabled)return;if(typeof JSZip==='undefined'){alert('Excel export library could not be loaded.');return;}button.disabled=true;const original=button.textContent;button.textContent='Preparing report…';
    try{const rows=filtered(),sheets=workbookParts(rows),excel=window.BoldrExcelUtils;if(!excel)throw new Error('Excel export tools could not be loaded.');const bits=['Boldr_Strengths_Insights',selectedLocations.size?[...selectedLocations].join('-'):'All_Locations',selectedDepartments.size?[...selectedDepartments].join('-'):'All_Departments',status.value||'All_Profiles',`Top${topN}`].map(v=>String(v).replace(/[^a-z0-9]+/gi,'_'));await excel.downloadWorkbook({sheets,stylesXml,filename:bits.join('_')+'.xlsx'});}catch(error){console.error('Strengths Insights export failed',error);alert('The Strengths Insights report could not be generated. Please try again.');}finally{button.disabled=false;button.textContent=original;}
  }
  $('downloadReport').addEventListener('click',downloadXlsx);
  render();
})();
