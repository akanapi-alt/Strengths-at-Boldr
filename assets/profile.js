(function(){
  const {employees, domains} = window.BOLDR_STRENGTHS_DATA;
  const params=new URLSearchParams(location.search);
  const id=params.get('id');
  const rawFrom=params.get('from')||'grid.html';
  const returnHref=/^(grid|insights)\.html(?:\?.*)?$/.test(rawFrom)?rawFrom:'grid.html';
  const returnLabel=returnHref.startsWith('insights.html')?'Back to Strengths Insights':'Back to People Grid';
  const e=employees.find(x=>x.id===id);
  const root=document.getElementById('profileRoot');
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const initials = name => name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
  if(!e){
    root.innerHTML=`<div class="profile-missing"><a class="back-link" href="${returnHref}">← ${returnLabel}</a><h1>Profile not found.</h1><p>This record is not available in the current strengths directory.</p></div>`;
    return;
  }
  document.title=`${e.name} | Strengths at Boldr`;

  const themeMeta={
    'Achiever':{action:'keep meaningful progress moving and gain energy from finishing what matters',question:'What kind of progress or accomplishment gives you the most energy?'},
    'Arranger':{action:'coordinate people, resources and moving parts while adapting as circumstances change',question:'When several moving parts are in play, what helps you see the best arrangement?'},
    'Belief':{action:'anchor decisions in enduring values and a clear sense of purpose',question:'Which values are most important for you to protect when making a difficult decision?'},
    'Consistency':{action:'look for fairness, clear expectations and dependable ways of working',question:'Where does greater consistency or fairness help you do your best work?'},
    'Deliberative':{action:'surface risks early and move carefully when a decision has consequences',question:'What information or assurance helps you feel ready to commit?'},
    'Discipline':{action:'create order, routines and dependable structure around the work',question:'Which routines or structures help you stay at your best?'},
    'Focus':{action:'identify the destination, prioritize what matters and keep effort pointed toward it',question:'What helps you protect focus when competing priorities appear?'},
    'Responsibility':{action:'take personal ownership of commitments and follow through on what you promise',question:'What makes a commitment feel genuinely owned by you?'},
    'Restorative':{action:'notice what is not working and stay engaged until a practical solution emerges',question:'What kinds of problems are most satisfying for you to solve?'},
    'Activator':{action:'turn discussion into motion and help ideas cross the line into action',question:'What tells you that an idea is ready to move from discussion into action?'},
    'Command':{action:'bring directness and decisiveness when a situation needs a clear position',question:'When does directness help a team most, and when do you deliberately soften it?'},
    'Communication':{action:'translate ideas into language, stories or explanations that other people can follow',question:'What helps you make a complex idea clear and memorable for other people?'},
    'Competition':{action:'use comparison and visible standards to sharpen effort and raise performance',question:'What kind of benchmark motivates you without narrowing your view too much?'},
    'Maximizer':{action:'notice what is already working well and look for ways to raise it toward excellence',question:'How do you decide which good work is worth investing in to make exceptional?'},
    'Self-Assurance':{action:'trust your judgment and remain comfortable owning a direction when certainty is limited',question:'What helps you know when to trust your own judgment and when to seek another perspective?'},
    'Significance':{action:'seek work that matters, creates visible value and leaves a meaningful mark',question:'What makes a piece of work feel significant enough to deserve your best effort?'},
    'Woo':{action:'build quick connection with new people and create social momentum',question:'How do you turn an initial connection into a useful working relationship?'},
    'Adaptability':{action:'stay responsive to the present moment and adjust comfortably as circumstances shift',question:'When plans change quickly, what helps you decide what to adapt and what to preserve?'},
    'Connectedness':{action:'look for relationships, shared meaning and the larger pattern connecting people or events',question:'When you notice a connection others may not see yet, how do you make it useful to the team?'},
    'Developer':{action:'notice potential in other people and invest attention in their progress',question:'What signs of growth in another person make you want to invest more in them?'},
    'Empathy':{action:'notice emotional signals and consider how an experience may feel from another person’s perspective',question:'How do you use emotional cues without assuming you already know what someone needs?'},
    'Harmony':{action:'find workable common ground and reduce unnecessary friction so people can move forward',question:'How do you distinguish healthy disagreement from conflict that is no longer productive?'},
    'Includer':{action:'notice who is outside the conversation and widen participation',question:'Who is easiest to overlook in a discussion, and how do you bring them in meaningfully?'},
    'Individualization':{action:'notice what is distinct about each person and adapt how you work with them',question:'What differences between people most change how you choose to collaborate with them?'},
    'Positivity':{action:'bring energy, encouragement and an orientation toward possibility',question:'How do you keep optimism useful and grounded when circumstances are difficult?'},
    'Relator':{action:'invest deeply in trusted relationships and build credibility through genuine connection',question:'What helps a working relationship move from cordial to genuinely trusted for you?'},
    'Analytical':{action:'test assumptions, look for evidence and examine the logic behind a conclusion',question:'What evidence usually changes your mind when you have already formed a view?'},
    'Context':{action:'use history and precedent to understand how the present situation came to be',question:'Which parts of the past are most useful to understand before making a decision now?'},
    'Futuristic':{action:'picture what could be possible and use that future image to create direction',question:'What kind of future picture is vivid enough to change what you do today?'},
    'Ideation':{action:'generate fresh connections, possibilities and unconventional ways to frame a problem',question:'What conditions make it easiest for you to generate genuinely new ideas?'},
    'Input':{action:'collect useful information, examples and resources that may become valuable later',question:'How do you decide when you have gathered enough information to start using it?'},
    'Intellection':{action:'make space for reflection and sustained thinking before settling on meaning',question:'What kind of thinking time helps you turn reflection into something useful for others?'},
    'Learner':{action:'gain energy from learning, improving and moving through the process of becoming more capable',question:'What kind of learning challenge keeps you engaged rather than overwhelmed?'},
    'Strategic':{action:'spot alternative routes quickly and choose a path through complexity',question:'When several routes look possible, what helps you recognize the one worth pursuing?'}
  };

  const domainCounts=Object.fromEntries(Object.keys(domains).map(d=>[d,0]));
  e.strengths.slice(0,10).forEach(s=>domainCounts[s.domain]=(domainCounts[s.domain]||0)+1);
  const availableTop=Math.min(10,(e.strengths||[]).length);
  const domainBars=Object.entries(domains).map(([name,info])=>{const count=domainCounts[name]||0,p=availableTop?Math.round(count/availableTop*100):0;return `<div class="profile-domain-row" style="--domain:${info.color}"><div class="profile-domain-row-head"><span>${esc(name)}</span><strong>${count} of ${availableTop || 0}</strong></div><div class="profile-domain-track" role="img" aria-label="${esc(name)}: ${count} of ${availableTop || 0} available ranked themes, ${p}%"><span style="width:${p}%"></span></div></div>`;}).join('');

  const strengthRows=e.strengths.map(s=>{const meta=themeMeta[s.theme];const link=window.BOLDR_STRENGTHS_DATA.themeLinks?.[s.theme]||'https://www.gallup.com/cliftonstrengths/en/253715/home.aspx';return `<div class="ranked-strength ranked-strength-v12" style="--domain:${domains[s.domain].color}"><span class="ranked-number">${String(s.rank).padStart(2,'0')}</span><div class="ranked-strength-copy"><div class="ranked-strength-title"><span class="ranked-name">${esc(s.theme)}</span><span class="ranked-domain"><span class="domain-dot"></span>${esc(s.domain)}</span></div><p>${esc(meta?.action||'A CliftonStrengths talent theme represented in this person’s available ranked profile.')}</p><a href="${link}" target="_blank" rel="noopener">Official Gallup theme definition ↗</a></div></div>`;}).join('');
  const block=(title,text,icon)=>`<section class="collab-block ${text?'':'missing'}"><span class="collab-icon">${icon}</span><div><h3>${title}</h3><p>${text?esc(text):'No response is currently available in the source workbook.'}</p></div></section>`;

  function personalizedInsight(){
    const top=e.strengths.slice(0,5);
    if(!top.length) return {headline:'A conversation worth personalizing.',summary:'There is not enough Top 5 data in the current source record to create a responsible combination interpretation.',tension:'Use the person’s own examples and working preferences as the primary source of meaning.',questions:['Which parts of your work feel most natural to you?','What kind of contribution gives you the most energy?','What do colleagues often come to you for?']};
    const actions=top.map(s=>themeMeta[s.theme]?.action||`draw on ${s.theme} in their own way`);
    const topDomainCounts={}; top.forEach(s=>topDomainCounts[s.domain]=(topDomainCounts[s.domain]||0)+1);
    const dominant=Object.entries(topDomainCounts).sort((a,b)=>b[1]-a[1])[0];
    let tension='A useful tension to explore is which of these talents should lead in a given situation rather than trying to use all five at once.';
    if(dominant && dominant[1]>=3){
      tension={
        'Strategic Thinking':'A useful tension to explore is knowing when there is enough information, reflection or possibility on the table to move from thinking into action.',
        'Executing':'A useful tension to explore is protecting momentum and follow through while still leaving room for new information, different working styles and changing conditions.',
        'Relationship Building':'A useful tension to explore is sustaining connection and trust while still making space for disagreement, boundaries and difficult decisions when they are needed.',
        'Influencing':'A useful tension to explore is creating momentum and visibility while still leaving enough room for quieter perspectives, evidence and shared ownership.'
      }[dominant[0]]||tension;
    }
    const names=top.map(s=>s.theme);
    const headline=`${names[0]} + ${names[1]}: how the Top 5 may work together.`;
    const summary=`Taken together, these themes may create a pattern in which you ${actions[0]}. ${names[1]} may add an ability to ${actions[1]}, while ${names[2]} can help you ${actions[2]}. ${names[3]} and ${names[4]} may then shape how that contribution becomes a decision, action or shared understanding. Treat this as a developmental hypothesis to test against the person’s own experience, not a fixed personality verdict.`;
    const questions=top.slice(0,3).map(s=>themeMeta[s.theme]?.question||`How does ${s.theme} actually show up in your work?`);
    return {headline,summary,tension,questions};
  }
  const insight=personalizedInsight();
  const statusClass=(e.status||'').toLowerCase()==='active'?'is-active-status':(e.status||'').toLowerCase()==='inactive'?'is-inactive-status':'is-neutral-status';
  const reportAction=e.full34ReportUrl?`<a class="full34-link" href="${esc(e.full34ReportUrl)}" target="_blank" rel="noopener"><span><strong>Full 34 Report</strong><small>Open the original assessment report ↗</small></span></a>`:'';

  root.innerHTML=`
    <a class="back-link" href="${returnHref}">← ${returnLabel}</a>
    <section class="profile-hero-card">
      <div class="profile-hero-watermark" aria-hidden="true">${esc(initials(e.name))}</div>
      <div class="profile-hero-main">
        <p class="eyebrow light-eyebrow">Individual strengths profile</p>
        <h1>${esc(e.name)}</h1>
        <p class="profile-subtitle">${esc(e.role || 'Role not listed')}</p>
      </div>
      <aside class="profile-facts profile-facts-compact">
        <div class="fact"><span class="fact-label">Department</span><span class="fact-value">${esc(e.department || 'Not listed')}</span></div>
        <div class="fact"><span class="fact-label">Status</span><span class="fact-value status-value ${statusClass}">${esc(e.status || 'Not listed')}</span></div>
      </aside>
    </section>

    <section class="profile-domain-panel">
      <div class="profile-domain-copy"><p class="eyebrow">Top 10 pattern</p><h2>How the available top themes spread across the four domains.</h2><p>Each bar shows the share of this person’s available ranked themes that falls in the domain. It is a placement pattern, not a score or capability rating.</p></div>
      <div class="profile-domain-bars">${domainBars}</div>
    </section>

    <div class="profile-grid">
      <section class="profile-themes-section">
        <div class="profile-section-heading"><div><p class="eyebrow">Full strengths profile</p><h2 class="profile-section-title">Available Top 10 themes</h2><p class="profile-heading-support">Rank order and concise theme context from the source assessment data.</p></div>${reportAction}</div>
        <div class="ranked-strengths">${strengthRows || '<div class="ranked-strength"><span class="ranked-name">Strengths data pending</span></div>'}</div>
        <p class="profile-note">Theme order reflects the assessment data available in the Boldr workbook. Some historical records contain fewer than 10 populated ranks. Lower ranked or unlisted themes are not automatically weaknesses.</p>
      </section>
      <section class="profile-collab-section">
        <div class="profile-section-heading"><div><p class="eyebrow">Collaboration</p><h2 class="profile-section-title">Working with me</h2></div></div>
        <div class="collab-stack">${block('Best of me',e.bestOfMe,'✦')}${block('Count on me to…',e.countOnMe,'↗')}${block('What I need from you',e.whatINeed,'○')}</div>
        <div class="personalized-guidance">
          <span class="personalized-guidance-label">Top 5 conversation prompt</span>
          <h3>${esc(insight.headline)}</h3>
          <p>${esc(insight.summary)}</p>
          <div class="productive-tension"><strong>One productive tension to explore</strong><span>${esc(insight.tension)}</span></div>
          <div class="conversation-questions"><strong>Start the conversation</strong>${insight.questions.map(q=>`<span>${esc(q)}</span>`).join('')}</div>
        </div>
      </section>
    </div>`;
})();
