(function(){
  const data = window.BOLDR_STRENGTHS_DATA;
  if (!data) return;

  const count = document.getElementById('profileCount');
  if (count) count.textContent = data.meta.directoryProfiles;
  const scope = document.getElementById('heroDirectoryScope');
  if (scope) scope.textContent = `${data.meta.directoryProfiles} strengths profiles are currently available: ${data.meta.statusCounts.Active} active and ${data.meta.statusCounts.Inactive} inactive historical profiles.`;

  const copy = {
    'Executing': { index:'01 / 04', summary:'Turning intention into practical progress.', contributes:'Follow through, organization, ownership and the steady movement from idea to outcome.', notice:'A team needs structure, accountability, practical execution or a problem moved toward resolution.', guide:'https://www.gallup.com/cliftonstrengths/en/252086/executing-domain.aspx' },
    'Influencing': { index:'02 / 04', summary:'Creating momentum around ideas.', contributes:'Visibility, advocacy, communication and the energy to bring people toward an idea or direction.', notice:'A message needs traction, a decision needs momentum, or an idea needs a confident voice and broader support.', guide:'https://www.gallup.com/cliftonstrengths/en/252089/influencing-domain.aspx' },
    'Relationship Building': { index:'03 / 04', summary:'Strengthening the connections that help teams work.', contributes:'Trust, connection, inclusion and the relational glue that helps individuals become a stronger team.', notice:'People need connection, understanding, belonging or a stronger partnership across different perspectives.', guide:'https://www.gallup.com/cliftonstrengths/en/252083/relationship-building-domain.aspx' },
    'Strategic Thinking': { index:'04 / 04', summary:'Making sense of information and possibilities.', contributes:'Analysis, learning, imagination and the ability to notice patterns or different routes forward.', notice:'A team needs context, insight, future possibilities or a different way to interpret a complex problem.', guide:'https://www.gallup.com/cliftonstrengths/en/252080/strategic-thinking-domain.aspx' }
  };

  const detail = document.getElementById('domainDetail');
  const tabs = [...document.querySelectorAll('.domain-tab')];
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  let activeDomain = 'Executing';
  let selectedTheme = null;

  function themeChoice(theme, domain, selected){
    const url = data.themeLinks?.[theme] || 'https://www.gallup.com/cliftonstrengths/en/253715/home.aspx';
    return `<span class="theme-choice${selected?' is-selected':''}" style="--theme-domain:${data.domains[domain].color}"><button type="button" class="theme-select" data-theme="${esc(theme)}" aria-pressed="${selected?'true':'false'}">${esc(theme)}</button><a class="theme-learn-link" href="${url}" target="_blank" rel="noopener" aria-label="Learn about ${esc(theme)} at Gallup" title="Learn about ${esc(theme)} at Gallup">↗</a></span>`;
  }

  function renderDomain(domain, requestedTheme){
    const info = data.domains[domain], text = copy[domain];
    if (!info || !text || !detail) return;
    activeDomain = domain;
    selectedTheme = info.themes.includes(requestedTheme) ? requestedTheme : info.themes[0];

    tabs.forEach(tab => {
      const active = tab.dataset.domain === domain;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-pressed', String(active));
    });

    const themeUrl = data.themeLinks?.[selectedTheme] || text.guide;
    const themes = info.themes.map(theme => themeChoice(theme, domain, theme === selectedTheme)).join('');
    detail.style.setProperty('--domain-color', info.color);
    detail.innerHTML = `
      <div class="domain-detail-decor" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="domain-detail-head">
        <span class="domain-detail-index">${text.index}</span>
        <div><h3>${esc(domain)}</h3><p>${esc(text.summary)}</p></div>
        <span class="domain-detail-count">${info.themes.length} themes</span>
      </div>
      <div class="domain-detail-grid">
        <div class="domain-detail-copy">
          <span class="domain-kicker">What it can contribute</span><p>${esc(text.contributes)}</p>
          <span class="domain-kicker second">You may notice it when</span><p>${esc(text.notice)}</p>
        </div>
        <div class="domain-detail-themes">
          <span class="domain-kicker">Themes in this domain</span>
          <div class="theme-links theme-selection-links">${themes}</div>
          <div class="domain-actions domain-actions-selected">
            <a class="domain-action-primary" href="grid.html?strength=${encodeURIComponent(selectedTheme)}&status=Active#directoryResults">Find people with ${esc(selectedTheme)} →</a>
            <a class="domain-action-secondary" href="${themeUrl}" target="_blank" rel="noopener">Learn more about ${esc(selectedTheme)} at Gallup ↗</a>
          </div>
        </div>
      </div>`;

    detail.querySelectorAll('.theme-select').forEach(button => {
      button.addEventListener('click', () => renderDomain(activeDomain, button.dataset.theme));
    });
  }

  tabs.forEach(tab => tab.addEventListener('click', () => renderDomain(tab.dataset.domain)));
  renderDomain('Executing', 'Achiever');
})();
