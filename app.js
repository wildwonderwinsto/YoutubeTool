/* ═══════════════════════════════════════════════
   IdeaEngine — Application Logic (v4.0)
   - Professional Sort Dropdown Button & Menu
   - Filter Settings Mini Window Modal
   - Interactive Range Sliders (Subscribers, Days, Views)
   ═══════════════════════════════════════════════ */

// ─── DOM References ───
const topicInput          = document.getElementById('topic-input');
const generateBtn         = document.getElementById('generate-btn');
const loadingState        = document.getElementById('loading-state');
const loadingMainText     = document.getElementById('loading-main-text');
const loadingSubText      = document.getElementById('loading-sub-text');
const resultsContainer    = document.getElementById('results-container');
const emptyState          = document.getElementById('empty-state');
const keywordCards        = document.getElementById('keyword-cards');
const titlesList          = document.getElementById('titles-list');
const videoGrid           = document.getElementById('video-grid');
const resultCountTag      = document.getElementById('result-count-tag');

const apiToggleBtn        = document.getElementById('api-toggle-btn');
const apiStatusText       = document.getElementById('api-status-text');
const apiPanel            = document.getElementById('api-panel');
const apiKeyInput         = document.getElementById('api-key-input');
const saveApiKeyBtn       = document.getElementById('save-api-key-btn');
const clearApiKeyBtn      = document.getElementById('clear-api-key-btn');
const apiModeBadge        = document.getElementById('api-mode-badge');
const scanModeIndicator   = document.getElementById('scan-mode-indicator');

// Control Bar & Sort Dropdown DOM
const sortDropdownBtn     = document.getElementById('sort-dropdown-btn');
const currentSortLabel    = document.getElementById('current-sort-label');
const sortMenu            = document.getElementById('sort-menu');

// Filter Modal Window DOM
const filterModalOpenBtn  = document.getElementById('filter-modal-open-btn');
const activeFilterBadge   = document.getElementById('active-filter-badge');
const filterModalBackdrop = document.getElementById('filter-modal-backdrop');
const filterModalCloseBtn = document.getElementById('filter-modal-close-btn');

// Slider & Filter Controls
const maxSubsSlider       = document.getElementById('max-subs-slider');
const maxSubsVal          = document.getElementById('max-subs-val');
const maxDaysSlider       = document.getElementById('max-days-slider');
const maxDaysVal          = document.getElementById('max-days-val');
const minViewsSlider      = document.getElementById('min-views-slider');
const minViewsVal         = document.getElementById('min-views-val');

const minOutlierSelect    = document.getElementById('min-outlier-select');
const vphSegmented        = document.getElementById('vph-segmented');

const resetFiltersBtn     = document.getElementById('reset-filters-btn');
const applyFiltersBtn     = document.getElementById('apply-filters-btn');

// ─── Filter & Sort State ───
const defaultFilters = {
  maxSubs: 100000,
  maxDays: 90,
  minViews: 10000,
  minOutlier: 2,
  vphDirection: 'rising',
  sortBy: 'outlier'
};

const sortLabels = {
  outlier: 'Outlier Score',
  vph: 'VPH Velocity',
  views: 'Total Views',
  newest: 'Publish Date'
};

let activeFilters = { ...defaultFilters };
let lastRawData = null;
let userApiKey = localStorage.getItem('ideaengine_yt_apikey') || '';

// ─── API Key UI Management ───
function updateApiKeyUI() {
  if (userApiKey) {
    apiToggleBtn.classList.add('active-key');
    apiStatusText.textContent = 'Live YouTube API Active';
    apiModeBadge.textContent = 'Mode: Live YouTube API';
    scanModeIndicator.textContent = 'Live YouTube Data';
    clearApiKeyBtn.classList.remove('hidden');
    apiKeyInput.value = userApiKey;
  } else {
    apiToggleBtn.classList.remove('active-key');
    apiStatusText.textContent = 'Connect Live YouTube API';
    apiModeBadge.textContent = 'Mode: Deterministic Engine';
    scanModeIndicator.textContent = 'Deterministic Engine';
    clearApiKeyBtn.classList.add('hidden');
    apiKeyInput.value = '';
  }
}

apiToggleBtn.addEventListener('click', () => apiPanel.classList.toggle('hidden'));

saveApiKeyBtn.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (key) {
    userApiKey = key;
    localStorage.setItem('ideaengine_yt_apikey', key);
    updateApiKeyUI();
    apiPanel.classList.add('hidden');
  }
});

clearApiKeyBtn.addEventListener('click', () => {
  userApiKey = '';
  localStorage.removeItem('ideaengine_yt_apikey');
  updateApiKeyUI();
});

updateApiKeyUI();

// ─── Sort Dropdown Logic ───
sortDropdownBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  sortMenu.classList.toggle('hidden');
  sortDropdownBtn.classList.toggle('active', !sortMenu.classList.contains('hidden'));
});

document.addEventListener('click', (e) => {
  if (!sortMenu.contains(e.target) && !sortDropdownBtn.contains(e.target)) {
    sortMenu.classList.add('hidden');
    sortDropdownBtn.classList.remove('active');
  }
});

sortMenu.querySelectorAll('.sort-item').forEach(item => {
  item.addEventListener('click', () => {
    sortMenu.querySelectorAll('.sort-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    
    activeFilters.sortBy = item.dataset.sort;
    currentSortLabel.textContent = sortLabels[activeFilters.sortBy];
    sortMenu.classList.add('hidden');
    sortDropdownBtn.classList.remove('active');
    
    if (lastRawData) applyFilterAndSortAndRender();
  });
});

// ─── Filter Settings Modal Logic ───
filterModalOpenBtn.addEventListener('click', () => {
  filterModalBackdrop.classList.remove('hidden');
  filterModalOpenBtn.classList.add('active');
});

filterModalCloseBtn.addEventListener('click', closeFilterModal);

filterModalBackdrop.addEventListener('click', (e) => {
  if (e.target === filterModalBackdrop) closeFilterModal();
});

function closeFilterModal() {
  filterModalBackdrop.classList.add('hidden');
  filterModalOpenBtn.classList.remove('active');
}

// Interactive Sliders Event Listeners
maxSubsSlider.addEventListener('input', () => {
  const val = parseInt(maxSubsSlider.value, 10);
  maxSubsVal.textContent = val >= 1000000 ? '1M (All)' : formatShortNum(val) + ' subs';
});

maxDaysSlider.addEventListener('input', () => {
  const val = parseInt(maxDaysSlider.value, 10);
  maxDaysVal.textContent = val + ' days';
});

minViewsSlider.addEventListener('input', () => {
  const val = parseInt(minViewsSlider.value, 10);
  minViewsVal.textContent = formatShortNum(val) + ' views';
});

// Segmented VPH Control
vphSegmented.addEventListener('click', e => {
  const btn = e.target.closest('.seg-btn');
  if (!btn) return;
  vphSegmented.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeFilters.vphDirection = btn.dataset.vph;
});

// Sync State from Modal Sliders
function syncStateFromModal() {
  activeFilters.maxSubs = parseInt(maxSubsSlider.value, 10);
  activeFilters.maxDays = parseInt(maxDaysSlider.value, 10);
  activeFilters.minViews = parseInt(minViewsSlider.value, 10);
  activeFilters.minOutlier = parseFloat(minOutlierSelect.value);

  // Update badge count
  let count = 0;
  if (activeFilters.maxSubs < 1000000) count++;
  if (activeFilters.maxDays < 180) count++;
  if (activeFilters.minViews > 1000) count++;
  if (activeFilters.minOutlier > 1) count++;
  if (activeFilters.vphDirection === 'rising') count++;
  
  activeFilterBadge.textContent = count;
}

function syncModalFromState() {
  maxSubsSlider.value = activeFilters.maxSubs;
  maxSubsVal.textContent = activeFilters.maxSubs >= 1000000 ? '1M (All)' : formatShortNum(activeFilters.maxSubs) + ' subs';
  
  maxDaysSlider.value = activeFilters.maxDays;
  maxDaysVal.textContent = activeFilters.maxDays + ' days';

  minViewsSlider.value = activeFilters.minViews;
  minViewsVal.textContent = formatShortNum(activeFilters.minViews) + ' views';

  minOutlierSelect.value = activeFilters.minOutlier;

  vphSegmented.querySelectorAll('.seg-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.vph === activeFilters.vphDirection);
  });
}

applyFiltersBtn.addEventListener('click', () => {
  syncStateFromModal();
  closeFilterModal();
  if (lastRawData) applyFilterAndSortAndRender();
});

resetFiltersBtn.addEventListener('click', () => {
  activeFilters = { ...defaultFilters };
  syncModalFromState();
  syncStateFromModal();
  if (lastRawData) applyFilterAndSortAndRender();
});

// Example Topic Chips
document.querySelectorAll('.example-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    topicInput.value = chip.dataset.topic;
    runGenerate();
  });
});

// Generate Button
generateBtn.addEventListener('click', runGenerate);
topicInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') runGenerate();
});

// ─── Main Scan Flow ───
async function runGenerate() {
  const topic = topicInput.value.trim();
  if (!topic) {
    topicInput.focus();
    return;
  }

  syncStateFromModal();

  emptyState.classList.add('hidden');
  resultsContainer.classList.remove('visible');
  loadingState.classList.add('visible');

  const subLabel = formatShortNum(activeFilters.maxSubs);
  loadingSubText.textContent = `Filtering channels under ${subLabel} subs · ${activeFilters.maxDays}d window`;

  if (userApiKey) {
    loadingMainText.textContent = 'Fetching live data from YouTube Data API v3...';
    try {
      lastRawData = await fetchLiveYouTubeData(topic, activeFilters, userApiKey);
      applyFilterAndSortAndRender();
    } catch (err) {
      console.error('YouTube API Error:', err);
      alert(`YouTube API Error: ${err.message}. Falling back to deterministic engine.`);
      lastRawData = generateDeterministicData(topic);
      applyFilterAndSortAndRender();
    } finally {
      loadingState.classList.remove('visible');
      resultsContainer.classList.add('visible');
    }
  } else {
    loadingMainText.textContent = 'Scanning breakout videos & scoring titles…';
    setTimeout(() => {
      lastRawData = generateDeterministicData(topic);
      applyFilterAndSortAndRender();
      loadingState.classList.remove('visible');
      resultsContainer.classList.add('visible');
    }, 450);
  }
}

// Filter, Sort, & Render Pipeline
function applyFilterAndSortAndRender() {
  if (!lastRawData) return;

  let filtered = lastRawData.videos.filter(v => {
    if (v.rawSubs > activeFilters.maxSubs) return false;
    if (v.daysAgo > activeFilters.maxDays) return false;
    if (v.rawViews < activeFilters.minViews) return false;
    if (v.outlier < activeFilters.minOutlier) return false;
    if (activeFilters.vphDirection === 'rising' && v.vphDirection !== 'rising') return false;
    return true;
  });

  // Sort video list
  if (activeFilters.sortBy === 'outlier') {
    filtered.sort((a, b) => b.outlier - a.outlier);
  } else if (activeFilters.sortBy === 'vph') {
    filtered.sort((a, b) => b.vph - a.vph);
  } else if (activeFilters.sortBy === 'views') {
    filtered.sort((a, b) => b.rawViews - a.rawViews);
  } else if (activeFilters.sortBy === 'newest') {
    filtered.sort((a, b) => a.daysAgo - b.daysAgo);
  }

  resultCountTag.textContent = `${filtered.length} videos found`;

  renderKeywords(lastRawData.keywords);
  renderTitles(lastRawData.titles);
  renderVideos(filtered);
}

// ─── Render Components ───
function renderKeywords(kw) {
  const qualityClass = (level) => level === 'High' ? 'kw-card--good' : level === 'Medium' ? 'kw-card--mid' : 'kw-card--bad';
  const competitionClass = (level) => level === 'Low' ? 'kw-card--good' : level === 'Medium' ? 'kw-card--mid' : 'kw-card--bad';

  keywordCards.innerHTML = `
    <div class="kw-card ${qualityClass(kw.volumeLevel)}">
      <div class="kw-card-label">Search Volume</div>
      <div class="kw-card-value">${kw.volumeLevel}</div>
      <div class="kw-card-meta">~${kw.volumeNumber.toLocaleString()} searches/mo</div>
    </div>
    <div class="kw-card ${competitionClass(kw.competitionLevel)}">
      <div class="kw-card-label">Competition</div>
      <div class="kw-card-value">${kw.competitionLevel}</div>
      <div class="kw-card-meta">${kw.competitionDesc}</div>
    </div>
    <div class="kw-card kw-card--accent">
      <div class="kw-card-label">Overall Score</div>
      <div class="kw-card-value">${kw.overallScore}<span style="font-size:0.875rem;color:var(--paper-mute)">/100</span></div>
      <div class="kw-card-meta">${kw.overallLabel}</div>
    </div>
    <div class="kw-card">
      <div class="kw-card-label">Avg VPH (Top Results)</div>
      <div class="kw-card-value" style="color:var(--vph-rising)">${kw.avgVph}</div>
      <div class="kw-card-meta">views/hr across top videos</div>
    </div>
  `;
}

function renderTitles(titles) {
  titlesList.innerHTML = titles.map((t, i) => `
    <div class="title-card">
      <span class="title-rank">${i + 1}</span>
      <div class="title-content">
        <div class="title-text">${escapeHtml(t.title)}</div>
        <div class="title-context">${escapeHtml(t.context)}</div>
      </div>
      <div class="title-score-wrapper">
        <div class="score-bar-track">
          <div class="score-bar-fill" style="width: ${t.score}%"></div>
        </div>
        <span class="score-number">${t.score}</span>
      </div>
    </div>
  `).join('');
}

function renderVideos(videos) {
  if (videos.length === 0) {
    videoGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 48px; text-align: center; color: var(--paper-mute); background: var(--surface); border: 1px dashed var(--line); border-radius: var(--radius-lg);">
        <p style="font-family: var(--font-display); font-size: 1rem; margin-bottom: 8px; color: var(--paper);">No videos match your active filter criteria</p>
        <p style="font-size: 0.8125rem;">Try adjusting subscriber, age, or view sliders in the <strong>Filters</strong> window.</p>
      </div>
    `;
    return;
  }

  videoGrid.innerHTML = videos.map(v => {
    const tier      = getOutlierTier(v.outlier);
    const vphBadge  = getVphBadge(v.vph, v.vphDirection);
    const videoUrl  = v.videoUrl || `https://www.youtube.com/watch?v=${v.id}`;

    return `
      <div class="video-card">
        <div class="video-thumb">
          <a href="${videoUrl}" target="_blank" rel="noopener" class="video-thumb-link">
            <img class="video-thumb-img" src="${v.thumbUrl}" alt="" loading="lazy">
            <span class="outlier-pin outlier-pin--${tier.key}">${tier.icon} ${v.outlier.toFixed(1)}x</span>
            <div class="play-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <span class="video-duration">${v.duration}</span>
          </a>
        </div>
        <div class="video-info">
          <div class="video-title">
            <a href="${videoUrl}" target="_blank" rel="noopener">${escapeHtml(v.title)}</a>
          </div>
          <div class="video-channel-row">
            <span class="channel-avatar"><img src="${v.avatarUrl}" alt="" loading="lazy"></span>
            <span class="channel-name">${escapeHtml(v.channel)}</span>
            <span class="channel-subs">${v.subs}</span>
          </div>
          <div class="video-badges">
            ${vphBadge}
            <span class="badge badge--views">
              <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
              ${v.views}
            </span>
          </div>
          <div class="video-stats-row">
            <span class="video-stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
              ${v.likes}
            </span>
            <span class="video-stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
              ${v.comments}
            </span>
            <span class="video-stat" style="margin-left:auto; font-style:italic;">
              Published ${v.publishedAgo}
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getOutlierTier(outlier) {
  if (outlier >= 10) return { key: 'high', icon: '🔴' };
  if (outlier >= 5)  return { key: 'mid',  icon: '🟣' };
  if (outlier >= 2)  return { key: 'low',  icon: '🔵' };
  return { key: 'base', icon: '⚫' };
}

function getVphBadge(vph, direction) {
  let cls = direction === 'rising' ? 'badge--vph-rising' : direction === 'cooling' ? 'badge--vph-cooling' : 'badge--vph-neutral';
  const arrow = direction === 'rising' ? '↑' : direction === 'cooling' ? '↓' : '→';
  return `<span class="badge ${cls}">${arrow} ${vph.toLocaleString()}/hr</span>`;
}

// ─── LIVE YOUTUBE API V3 INTEGRATION ───
async function fetchLiveYouTubeData(topic, filters, apiKey) {
  const publishedAfterDate = new Date();
  publishedAfterDate.setDate(publishedAfterDate.getDate() - 180);
  const publishedAfterIso = publishedAfterDate.toISOString();

  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(topic)}&type=video&publishedAfter=${publishedAfterIso}&maxResults=50&key=${apiKey}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  if (searchData.error) throw new Error(searchData.error.message);

  const items = searchData.items || [];
  if (items.length === 0) throw new Error("No videos found for this topic.");

  const videoIds = items.map(i => i.id.videoId).join(',');
  const channelIds = [...new Set(items.map(i => i.snippet.channelId))].join(',');

  const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${apiKey}`;
  const videoDetailsRes = await fetch(videoDetailsUrl);
  const videoDetailsData = await videoDetailsRes.json();
  const videoDetailsMap = {};
  (videoDetailsData.items || []).forEach(v => { videoDetailsMap[v.id] = v; });

  const channelDetailsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds}&key=${apiKey}`;
  const channelDetailsRes = await fetch(channelDetailsUrl);
  const channelDetailsData = await channelDetailsRes.json();
  const channelDetailsMap = {};
  (channelDetailsData.items || []).forEach(c => { channelDetailsMap[c.id] = c; });

  let processedVideos = [];
  let totalVph = 0;

  items.forEach(item => {
    const vId = item.id.videoId;
    const vDetail = videoDetailsMap[vId];
    const cDetail = channelDetailsMap[item.snippet.channelId];
    if (!vDetail || !cDetail) return;

    const subCount = parseInt(cDetail.statistics.subscriberCount || '0', 10);
    const viewCount = parseInt(vDetail.statistics.viewCount || '0', 10);
    const likeCount = parseInt(vDetail.statistics.likeCount || '0', 10);
    const commentCount = parseInt(vDetail.statistics.commentCount || '0', 10);

    const pubDate = new Date(vDetail.snippet.publishedAt);
    const daysAgo = Math.max(0, Math.floor((new Date() - pubDate) / (1000 * 60 * 60 * 24)));
    const hoursPublished = Math.max(1, (new Date() - pubDate) / (1000 * 60 * 60));
    const vph = Math.round(viewCount / hoursPublished);
    totalVph += vph;

    const channelAvgEstimate = Math.max(500, subCount * 0.15);
    const outlier = parseFloat((viewCount / channelAvgEstimate).toFixed(1));
    const isRising = vph > 50;

    processedVideos.push({
      id: vId,
      title: vDetail.snippet.title,
      channel: vDetail.snippet.channelTitle,
      rawSubs: subCount,
      subs: formatNumber(subCount) + ' subs',
      outlier,
      vph,
      vphDirection: isRising ? 'rising' : 'cooling',
      rawViews: viewCount,
      views: formatNumber(viewCount),
      likes: formatNumber(likeCount),
      comments: formatNumber(commentCount),
      duration: parseIsoDuration(vDetail.contentDetails.duration),
      daysAgo,
      publishedAgo: timeAgo(pubDate),
      thumbUrl: vDetail.snippet.thumbnails.high?.url || vDetail.snippet.thumbnails.medium?.url,
      avatarUrl: cDetail.snippet.thumbnails.default?.url || avatarUrlFor(vDetail.snippet.channelTitle),
      videoUrl: `https://www.youtube.com/watch?v=${vId}`
    });
  });

  const volumeNumber = Math.min(300000, items.length * 12000);
  const volumeLevel = volumeNumber > 100000 ? 'High' : volumeNumber > 30000 ? 'Medium' : 'Low';
  const competitionLevel = items.length > 25 ? 'High' : items.length > 12 ? 'Medium' : 'Low';
  const competitionDesc = competitionLevel === 'Low' ? 'Few strong competitors' : competitionLevel === 'Medium' ? 'Moderate competition' : 'Saturated — hard to rank';
  const overallScore = Math.min(95, Math.max(30, Math.round(85 - items.length * 1.5)));
  const overallLabel = overallScore >= 80 ? 'Very High — great opportunity' : overallScore >= 60 ? 'High — worth targeting' : 'Moderate — competitive';

  const keywords = {
    volumeLevel,
    volumeNumber,
    competitionLevel,
    competitionDesc,
    overallScore,
    overallLabel,
    avgVph: processedVideos.length ? Math.round(totalVph / processedVideos.length) : 150
  };

  const titles = generateGroundedTitles(topic);

  return { keywords, titles, videos: processedVideos };
}

// ─── STRICT TOPIC-SEEDED PRNG ENGINE ───
function createTopicPRNG(topicString) {
  const normalized = topicString.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return function() {
    hash = (hash + 0x6D2B79F5) | 0;
    let t = Math.imul(hash ^ (hash >>> 15), 1 | hash);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateDeterministicData(topic) {
  const rng = createTopicPRNG(topic);
  const topicCap = topic.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
  const randFloat = (min, max, dec = 1) => parseFloat((rng() * (max - min) + min).toFixed(dec));
  const randPick = (arr) => arr[Math.floor(rng() * arr.length)];

  // Fixed Keyword Data strictly per topic
  const volumeNum = randInt(18000, 280000);
  const volumeLevel = volumeNum > 100000 ? 'High' : volumeNum > 30000 ? 'Medium' : 'Low';
  const compRoll = rng();
  const competitionLevel = compRoll < 0.35 ? 'Low' : compRoll < 0.7 ? 'Medium' : 'High';
  const competitionDesc = competitionLevel === 'Low' ? 'Few strong competitors' : competitionLevel === 'Medium' ? 'Moderate competition' : 'Saturated — hard to rank';

  let overallScore = volumeLevel === 'High' && competitionLevel === 'Low' ? randInt(80, 95) : volumeLevel === 'High' ? randInt(62, 78) : randInt(45, 68);
  const overallLabel = overallScore >= 80 ? 'Very High — great opportunity' : overallScore >= 60 ? 'High — worth targeting' : 'Moderate — competitive';
  const avgVph = randInt(120, 750);

  const keywords = {
    volumeLevel,
    volumeNumber: volumeNum,
    competitionLevel,
    competitionDesc,
    overallScore,
    overallLabel,
    avgVph
  };

  // Fixed Titles
  const titlePatterns = [
    (t) => `I Tried ${t} for 30 Days — Here's What Actually Happened`,
    (t) => `${t}: The Complete Beginner's Guide (${new Date().getFullYear()})`,
    (t) => `Stop Making These ${randInt(3,7)} Mistakes with ${t}`,
    (t) => `Why Nobody Talks About ${t} (The Truth)`,
    (t) => `${t} on a Budget — What $${randInt(50,300)} Gets You`,
    (t) => `I Tested Every ${t} Method So You Don't Have To`,
  ];
  const contextPatterns = [
    (t) => `Hook: personal challenge format + time constraint. Pairs well with before/after thumbnails.`,
    (t) => `Evergreen listicle — high search intent, targets "how to" queries. Strong for SEO.`,
    (t) => `Negative hook ("stop" / "mistakes") — high CTR because it triggers loss aversion.`,
    (t) => `Curiosity gap with authority framing — drives clicks from viewers wanting secrets.`,
    (t) => `Budget angle narrows audience to decision-stage viewers — high comment engagement.`,
    (t) => `Comparison/testing format — viewers stay to see the ultimate winner.`,
  ];

  const titles = titlePatterns.map((pat, i) => ({
    title: pat(topicCap),
    context: contextPatterns[i](topicCap),
    score: Math.max(50, 95 - i * 5)
  }));

  const channelPool = [
    'SimpleTech', 'The Curious Creator', 'LifeWithMike', 'MinimalMind', 'DailyDose',
    'Alex Explains', 'ProTips Daily', 'Real Talk with Sam', 'The Side Project', 'NerdNest',
    'BudgetBoss', 'The Honest Review', 'CreatorLab', 'SmartStart', 'TinyDesk Studio',
    'Pixel & Pen', 'NoFluff Guide', 'Everyday Experiments', 'FocusForge', 'Clarity Co.',
    'Build & Scale', 'Design Craft', 'Code & Create', 'Vlog Vault'
  ];

  const videos = [];
  for (let i = 0; i < 24; i++) {
    const ch = channelPool[i % channelPool.length];
    const subCount = i < 6 ? randInt(1500, 24000) : i < 16 ? randInt(25000, 95000) : randInt(120000, 450000);
    const daysAgo = randInt(2, 120);
    const isRising = i % 3 !== 0;
    const outlier = randFloat(1.2, 28.0, 1);
    const vph = isRising ? randInt(140, 1800) : randInt(15, 95);
    const viewCount = randInt(15000, 1200000);

    const thumbSeed = `${topicCap}-${ch}-${i}`;

    videos.push({
      id: `mock-${i}`,
      title: `${topicCap} — Breakout Insight ${i + 1}`,
      channel: ch,
      rawSubs: subCount,
      subs: formatNumber(subCount) + ' subs',
      outlier,
      vph,
      vphDirection: isRising ? 'rising' : 'cooling',
      rawViews: viewCount,
      views: formatNumber(viewCount),
      likes: formatNumber(Math.floor(viewCount * 0.05)),
      comments: formatNumber(Math.floor(viewCount * 0.008)),
      duration: `${randInt(6,22)}:${randInt(10,59)}`,
      daysAgo,
      publishedAgo: `${daysAgo} days ago`,
      thumbUrl: `https://picsum.photos/seed/${encodeURIComponent(thumbSeed)}/480/270`,
      avatarUrl: avatarUrlFor(ch),
      videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(topicCap)}`
    });
  }

  return { keywords, titles, videos };
}

// ─── Helpers ───
function generateGroundedTitles(topic) {
  const topicCap = topic.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return [
    { title: `I Tried ${topicCap} for 30 Days — Real Results`, context: `Challenge hook — mirrors recent high-VPH breakout video structures.`, score: 95 },
    { title: `Stop Making These Mistakes with ${topicCap}`, context: `Negative hook — addresses common failure points in top search results.`, score: 90 },
    { title: `${topicCap}: Complete Guide for ${new Date().getFullYear()}`, context: `Evergreen setup — targets ongoing YouTube search traffic.`, score: 85 },
    { title: `Why ${topicCap} is Surging Right Now`, context: `Trending analysis pattern — triggers curiosity in browse feeds.`, score: 80 },
    { title: `${topicCap} on a Budget — Tested & Ranked`, context: `Budget comparison — attracts high-intent buyers and decision makers.`, score: 75 },
    { title: `The Only ${topicCap} Video You Need`, context: `Definitive title pattern — positions content as the single best resource.`, score: 70 }
  ];
}

function avatarUrlFor(channelName) {
  const bg = 'ffb020,4a9eff,b565f5,34d399,75747c';
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(channelName)}&backgroundColor=${bg}`;
}

function escapeHtml(str) {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function formatShortNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(0) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
}

function parseIsoDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return "10:00";
  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '') || '0';
  const seconds = (match[3] || '').replace('S', '') || '0';
  const secStr = seconds.padStart(2, '0');
  if (hours) return `${hours}:${minutes.padStart(2, '0')}:${secStr}`;
  return `${minutes}:${secStr}`;
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + " year" + (interval > 1 ? "s" : "") + " ago";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + " month" + (interval > 1 ? "s" : "") + " ago";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + " day" + (interval > 1 ? "s" : "") + " ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + " hour" + (interval > 1 ? "s" : "") + " ago";
  return "just now";
}
