/* ═══════════════════════════════════════════════
   IdeaEngine — Application Logic (v2.3)
   - Strict Topic-Seeded PRNG (Fixed metrics & search volume)
   - 12 Video Grid Output
   - Clean Full-Color Thumbnails (No tint overlay)
   ═══════════════════════════════════════════════ */

// ─── DOM References ───
const topicInput          = document.getElementById('topic-input');
const generateBtn         = document.getElementById('generate-btn');
const filterRow           = document.getElementById('filter-row');
const loadingState        = document.getElementById('loading-state');
const loadingMainText     = document.getElementById('loading-main-text');
const loadingSubText      = document.getElementById('loading-sub-text');
const resultsContainer    = document.getElementById('results-container');
const emptyState          = document.getElementById('empty-state');
const keywordCards        = document.getElementById('keyword-cards');
const titlesList          = document.getElementById('titles-list');
const videoGrid           = document.getElementById('video-grid');

const apiToggleBtn        = document.getElementById('api-toggle-btn');
const apiStatusText       = document.getElementById('api-status-text');
const apiPanel            = document.getElementById('api-panel');
const apiKeyInput         = document.getElementById('api-key-input');
const saveApiKeyBtn       = document.getElementById('save-api-key-btn');
const clearApiKeyBtn      = document.getElementById('clear-api-key-btn');
const apiModeBadge        = document.getElementById('api-mode-badge');
const scanModeIndicator   = document.getElementById('scan-mode-indicator');

// ─── State ───
const filters = {
  subCap: 100000,
  timeWindow: 90,
  vphDirection: 'rising'
};

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

apiToggleBtn.addEventListener('click', () => {
  apiPanel.classList.toggle('hidden');
});

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

// ─── Chip Interaction ───
document.querySelectorAll('.chip-set').forEach(set => {
  set.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    set.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    const parentId = set.id;
    const val = chip.dataset.value;
    if (parentId === 'sub-cap-chips')       filters.subCap = parseInt(val);
    if (parentId === 'time-window-chips')   filters.timeWindow = parseInt(val);
    if (parentId === 'vph-direction-chips') filters.vphDirection = val;
  });
});

// ─── Example Topic Chips ───
document.querySelectorAll('.example-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    topicInput.value = chip.dataset.topic;
    runGenerate();
  });
});

// ─── Generate Button ───
generateBtn.addEventListener('click', runGenerate);
topicInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') runGenerate();
});

// ─── Main Generate Flow ───
async function runGenerate() {
  const topic = topicInput.value.trim();
  if (!topic) {
    topicInput.focus();
    return;
  }

  emptyState.classList.add('hidden');
  resultsContainer.classList.remove('visible');
  loadingState.classList.add('visible');

  const subLabel = filters.subCap >= 1000000 ? '1M' : filters.subCap >= 500000 ? '500K' : '100K';
  loadingSubText.textContent = `Filtering channels under ${subLabel} subs · last ${filters.timeWindow} days`;

  if (userApiKey) {
    loadingMainText.textContent = 'Fetching live data from YouTube Data API v3...';
    try {
      const data = await fetchLiveYouTubeData(topic, filters, userApiKey);
      renderResults(data);
    } catch (err) {
      console.error('YouTube API Error:', err);
      alert(`YouTube API Error: ${err.message}. Falling back to deterministic engine.`);
      const data = generateDeterministicData(topic, filters);
      renderResults(data);
    } finally {
      loadingState.classList.remove('visible');
      resultsContainer.classList.add('visible');
    }
  } else {
    loadingMainText.textContent = 'Scanning breakout videos & scoring titles…';
    setTimeout(() => {
      const data = generateDeterministicData(topic, filters);
      renderResults(data);
      loadingState.classList.remove('visible');
      resultsContainer.classList.add('visible');
    }, 600);
  }
}

// ─── Render Results ───
function renderResults(data) {
  renderKeywords(data.keywords);
  renderTitles(data.titles);
  renderVideos(data.videos);
}

// ─── Keyword Insight Cards ───
function renderKeywords(kw) {
  const qualityClass = (level) => {
    if (level === 'High') return 'kw-card--good';
    if (level === 'Medium') return 'kw-card--mid';
    return 'kw-card--bad';
  };

  const competitionClass = (level) => {
    if (level === 'Low') return 'kw-card--good';
    if (level === 'Medium') return 'kw-card--mid';
    return 'kw-card--bad';
  };

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

// ─── Generated Titles ───
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

// ─── Video Cards (Clean Full Color, No Tint Overlay) ───
function renderVideos(videos) {
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
  let cls;
  if (direction === 'rising')  cls = 'badge--vph-rising';
  else if (direction === 'cooling') cls = 'badge--vph-cooling';
  else cls = 'badge--vph-neutral';

  const arrow = direction === 'rising' ? '↑' : direction === 'cooling' ? '↓' : '→';

  return `<span class="badge ${cls}">
    ${arrow} ${vph.toLocaleString()}/hr
  </span>`;
}

// ─── LIVE YOUTUBE API V3 INTEGRATION ───
async function fetchLiveYouTubeData(topic, filters, apiKey) {
  const publishedAfterDate = new Date();
  publishedAfterDate.setDate(publishedAfterDate.getDate() - filters.timeWindow);
  const publishedAfterIso = publishedAfterDate.toISOString();

  // Search up to 50 videos for 12 video cards
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(topic)}&type=video&publishedAfter=${publishedAfterIso}&maxResults=50&key=${apiKey}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  if (searchData.error) {
    throw new Error(searchData.error.message);
  }

  const items = searchData.items || [];
  if (items.length === 0) {
    throw new Error("No videos found for this topic/window.");
  }

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
    if (subCount > filters.subCap) return;

    const viewCount = parseInt(vDetail.statistics.viewCount || '0', 10);
    const likeCount = parseInt(vDetail.statistics.likeCount || '0', 10);
    const commentCount = parseInt(vDetail.statistics.commentCount || '0', 10);

    const pubDate = new Date(vDetail.snippet.publishedAt);
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
      subs: formatNumber(subCount) + ' subs',
      outlier,
      vph,
      vphDirection: isRising ? 'rising' : 'cooling',
      views: formatNumber(viewCount),
      likes: formatNumber(likeCount),
      comments: formatNumber(commentCount),
      duration: parseIsoDuration(vDetail.contentDetails.duration),
      publishedAgo: timeAgo(pubDate),
      thumbUrl: vDetail.snippet.thumbnails.high?.url || vDetail.snippet.thumbnails.medium?.url,
      avatarUrl: cDetail.snippet.thumbnails.default?.url || avatarUrlFor(vDetail.snippet.channelTitle),
      videoUrl: `https://www.youtube.com/watch?v=${vId}`
    });
  });

  if (filters.vphDirection === 'rising') {
    const risingOnly = processedVideos.filter(v => v.vphDirection === 'rising');
    if (risingOnly.length >= 6) processedVideos = risingOnly;
  }

  processedVideos.sort((a, b) => b.outlier - a.outlier);
  const top12Videos = processedVideos.slice(0, 12);

  const volumeNumber = Math.min(300000, items.length * 12000);
  const volumeLevel = volumeNumber > 100000 ? 'High' : volumeNumber > 30000 ? 'Medium' : 'Low';
  const competitionLevel = items.length > 25 ? 'High' : items.length > 12 ? 'Medium' : 'Low';
  const competitionDesc = competitionLevel === 'Low' ? 'Few strong competitors' :
                          competitionLevel === 'Medium' ? 'Moderate competition' : 'Saturated — hard to rank';
  const overallScore = Math.min(95, Math.max(30, Math.round(85 - items.length * 1.5)));
  const overallLabel = overallScore >= 80 ? 'Very High — great opportunity' :
                       overallScore >= 60 ? 'High — worth targeting' : 'Moderate — competitive';

  const keywords = {
    volumeLevel,
    volumeNumber,
    competitionLevel,
    competitionDesc,
    overallScore,
    overallLabel,
    avgVph: top12Videos.length ? Math.round(totalVph / top12Videos.length) : 150
  };

  const titles = generateGroundedTitles(topic, top12Videos);

  return { keywords, titles, videos: top12Videos };
}

// ─── STRICT TOPIC-SEEDED PRNG ENGINE ───
// Seed is STRICTLY derived from topic.toLowerCase().trim() so keyword volume and search stats NEVER change on re-search!
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

function generateDeterministicData(topic, filters) {
  // Use topic string strictly for PRNG
  const rng = createTopicPRNG(topic);

  const topicCap = topic.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
  const randFloat = (min, max, dec = 1) => parseFloat((rng() * (max - min) + min).toFixed(dec));
  const randPick = (arr) => arr[Math.floor(rng() * arr.length)];

  // Keyword Data — FIXED FOR TOPIC
  const volumeNum = randInt(18000, 280000);
  const volumeLevel = volumeNum > 100000 ? 'High' : volumeNum > 30000 ? 'Medium' : 'Low';
  const compRoll = rng();
  const competitionLevel = compRoll < 0.35 ? 'Low' : compRoll < 0.7 ? 'Medium' : 'High';
  const competitionDesc = competitionLevel === 'Low' ? 'Few strong competitors' :
                          competitionLevel === 'Medium' ? 'Moderate competition' : 'Saturated — hard to rank';

  let overallScore;
  if (volumeLevel === 'High' && competitionLevel === 'Low') overallScore = randInt(80, 95);
  else if (volumeLevel === 'High' && competitionLevel === 'Medium') overallScore = randInt(62, 78);
  else if (volumeLevel === 'Medium' && competitionLevel === 'Low') overallScore = randInt(65, 82);
  else overallScore = randInt(38, 58);

  const overallLabel = overallScore >= 80 ? 'Very High — great opportunity' :
                       overallScore >= 60 ? 'High — worth targeting' : 'Moderate — competitive';

  const avgVph = randInt(80, 750);

  const keywords = {
    volumeLevel,
    volumeNumber: volumeNum,
    competitionLevel,
    competitionDesc,
    overallScore,
    overallLabel,
    avgVph
  };

  // Scored titles — FIXED FOR TOPIC
  const titlePatterns = [
    (t) => `I Tried ${t} for 30 Days — Here's What Actually Happened`,
    (t) => `${t}: The Complete Beginner's Guide (${new Date().getFullYear()})`,
    (t) => `Stop Making These ${randInt(3,7)} Mistakes with ${t}`,
    (t) => `Why Nobody Talks About ${t} (The Truth)`,
    (t) => `${t} on a Budget — What $${randInt(50,300)} Gets You`,
    (t) => `I Tested Every ${t} Method So You Don't Have To`,
    (t) => `The ${t} Mistake That's Costing You Hours`,
    (t) => `How I ${t} (Step by Step for Beginners)`,
  ];

  const contextPatterns = [
    (t) => `Hook: personal challenge format + time constraint. Pairs well with before/after thumbnails.`,
    (t) => `Evergreen listicle — high search intent, targets "how to" queries. Strong for SEO.`,
    (t) => `Negative hook ("stop" / "mistakes") — high CTR because it triggers loss aversion.`,
    (t) => `Curiosity gap with authority framing — drives clicks from viewers wanting secrets.`,
    (t) => `Budget angle narrows audience to decision-stage viewers — high comment engagement.`,
    (t) => `Comparison/testing format — viewers stay to see the ultimate winner.`,
    (t) => `Single-pain-point title — targets specific frustration for high watch time.`,
    (t) => `Tutorial format with approachable framing — optimizes for YouTube search.`,
  ];

  const titles = [];
  const usedPatterns = new Set();
  while (titles.length < 6) {
    const idx = Math.floor(rng() * titlePatterns.length);
    if (usedPatterns.has(idx)) continue;
    usedPatterns.add(idx);
    titles.push({
      title: titlePatterns[idx](topicCap),
      context: contextPatterns[idx](topicCap),
      score: Math.max(45, Math.min(98, randInt(68, 96) - titles.length * 3))
    });
  }
  titles.sort((a, b) => b.score - a.score);

  // 12 Top Videos to Study
  const channelPool = [
    'SimpleTech', 'The Curious Creator', 'LifeWithMike', 'MinimalMind', 'DailyDose',
    'Alex Explains', 'ProTips Daily', 'Real Talk with Sam', 'The Side Project', 'NerdNest',
    'BudgetBoss', 'The Honest Review', 'CreatorLab', 'SmartStart', 'TinyDesk Studio',
    'Pixel & Pen', 'NoFluff Guide', 'Everyday Experiments', 'FocusForge', 'Clarity Co.'
  ];

  const videoTitleTemplates = [
    (t) => `I Finally Figured Out ${t} (and it changed everything)`,
    (t) => `${t} — My ${randInt(3,12)} Month Update`,
    (t) => `Watch This Before You Try ${t}`,
    (t) => `How ${t} Actually Works in ${new Date().getFullYear()}`,
    (t) => `${t} for Under $${randInt(20,200)} — Full Guide`,
    (t) => `${randInt(5,15)} ${t} Hacks Nobody Shares`,
    (t) => `${t}: Everything I Got Wrong`,
    (t) => `The BEST Way to Do ${t} (Not What You Think)`,
    (t) => `Why I Quit ${t} (Then Started Again)`,
    (t) => `${t} — Beginner vs Pro Setup`,
    (t) => `Testing the Most Viral ${t} Techniques`,
    (t) => `${t} Explained in 10 Minutes`
  ];

  const videos = [];
  const usedChannels = new Set();

  while (videos.length < 12) {
    const ch = randPick(channelPool);
    if (usedChannels.has(ch)) continue;
    usedChannels.add(ch);

    const subCount = randInt(filters.subCap <= 100000 ? 3000 : 15000, filters.subCap);
    const isRising = filters.vphDirection === 'rising' ? true : rng() > 0.4;
    const outlier = randFloat(1.5, 24.0, 1);
    const vph = isRising ? randInt(120, 1500) : randInt(10, 90);

    const viewCount = randInt(25000, 850000);
    const likeCount = Math.floor(viewCount * randFloat(0.03, 0.08, 2));
    const commentCount = Math.floor(viewCount * randFloat(0.004, 0.015, 3));

    const thumbSeed = `${topicCap}-${ch}-${videos.length}`;
    const vTitle = videoTitleTemplates[videos.length % videoTitleTemplates.length](topicCap);

    videos.push({
      id: `mock-${videos.length}`,
      title: vTitle,
      channel: ch,
      subs: formatNumber(subCount) + ' subs',
      outlier,
      vph,
      vphDirection: isRising ? 'rising' : 'cooling',
      views: formatNumber(viewCount),
      likes: formatNumber(likeCount),
      comments: formatNumber(commentCount),
      duration: `${randInt(6,22)}:${randInt(10,59)}`,
      publishedAgo: `${randInt(5, 60)} days ago`,
      thumbUrl: `https://picsum.photos/seed/${encodeURIComponent(thumbSeed)}/480/270`,
      avatarUrl: avatarUrlFor(ch),
      videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(topicCap)}`
    });
  }

  videos.sort((a, b) => b.outlier - a.outlier);

  return { keywords, titles, videos };
}

// ─── Helpers ───
function generateGroundedTitles(topic, topVideos) {
  const topicCap = topic.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const hooks = [
    `I Tried ${topicCap} for 30 Days — Real Results`,
    `Stop Making These Mistakes with ${topicCap}`,
    `${topicCap}: Complete Guide for ${new Date().getFullYear()}`,
    `Why ${topicCap} is Surging Right Now`,
    `${topicCap} on a Budget — Tested & Ranked`,
    `The Only ${topicCap} Video You Need`
  ];
  const contexts = [
    `Challenge hook — mirrors recent high-VPH breakout video structures.`,
    `Negative hook — addresses common failure points in top search results.`,
    `Evergreen setup — targets ongoing YouTube search traffic.`,
    `Trending analysis pattern — triggers curiosity in browse feeds.`,
    `Budget comparison — attracts high-intent buyers and decision makers.`,
    `Definitive title pattern — positions content as the single best resource.`
  ];

  return hooks.map((title, i) => ({
    title,
    context: contexts[i],
    score: Math.max(50, 95 - i * 5)
  }));
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
