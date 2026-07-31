/* ═══════════════════════════════════════════════
   IdeaEngine — Application Logic
   ═══════════════════════════════════════════════ */

// ─── DOM References ───
const topicInput       = document.getElementById('topic-input');
const generateBtn      = document.getElementById('generate-btn');
const filterRow        = document.getElementById('filter-row');
const loadingState     = document.getElementById('loading-state');
const loadingSubText   = document.getElementById('loading-sub-text');
const resultsContainer = document.getElementById('results-container');
const emptyState       = document.getElementById('empty-state');
const keywordCards     = document.getElementById('keyword-cards');
const titlesList       = document.getElementById('titles-list');
const videoGrid        = document.getElementById('video-grid');

// ─── Filter State ───
const filters = {
  subCap: 100000,
  timeWindow: 90,
  vphDirection: 'rising'
};


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
function runGenerate() {
  const topic = topicInput.value.trim();
  if (!topic) {
    topicInput.focus();
    return;
  }

  // Show loading
  emptyState.classList.add('hidden');
  resultsContainer.classList.remove('visible');
  loadingState.classList.add('visible');

  const subLabel = filters.subCap >= 1000000 ? '1M' : filters.subCap >= 500000 ? '500K' : '100K';
  loadingSubText.textContent = `Filtering channels under ${subLabel} subs · last ${filters.timeWindow} days`;

  // Simulate async data fetch
  const delay = 1800 + Math.random() * 1200;
  setTimeout(() => {
    const data = generateMockData(topic, filters);
    renderResults(data);
    loadingState.classList.remove('visible');
    resultsContainer.classList.add('visible');
  }, delay);
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
      <div class="kw-card-meta">views/hr across top 20 videos</div>
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


// ─── Video Cards ───
function renderVideos(videos) {
  videoGrid.innerHTML = videos.map(v => {
    const tier      = getOutlierTier(v.outlier);
    const vphBadge  = getVphBadge(v.vph, v.vphDirection);

    return `
      <div class="video-card">
        <div class="video-thumb">
          <img class="video-thumb-img" src="${v.thumbUrl}" alt="" loading="lazy">
          <div class="video-thumb-tint tint--${tier.key}"></div>
          <span class="outlier-pin outlier-pin--${tier.key}">${tier.icon} ${v.outlier.toFixed(1)}x</span>
          <div class="play-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </div>
          <span class="video-duration">${v.duration}</span>
        </div>
        <div class="video-info">
          <div class="video-title">${escapeHtml(v.title)}</div>
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


// ─── Badge Helpers ───
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


// ─── Thumbnail & Avatar Generation ───
function thumbUrlFor(seed) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/480/270`;
}

function avatarUrlFor(channelName) {
  const bg = 'ffb020,4a9eff,b565f5,34d399,75747c';
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(channelName)}&backgroundColor=${bg}`;
}


// ─── Utilities ───
function escapeHtml(str) {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function randomDuration() {
  const mins = randomBetween(5, 25);
  const secs = randomBetween(0, 59);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function randomAgo(maxDays) {
  const days = randomBetween(2, maxDays);
  if (days > 60) return `${Math.floor(days / 30)} months ago`;
  if (days > 13) return `${Math.floor(days / 7)} weeks ago`;
  return `${days} days ago`;
}


// ─── Mock Data Generator ───
const TITLE_PATTERNS = [
  (t) => `I Tried ${t} for 30 Days — Here's What Actually Happened`,
  (t) => `${t}: The Complete Beginner's Guide (${new Date().getFullYear()})`,
  (t) => `Stop Making These ${randomBetween(3,7)} Mistakes with ${t}`,
  (t) => `Why Nobody Talks About ${t} (The Truth)`,
  (t) => `${t} on a Budget — What ${randomBetween(50,500)} Dollars Gets You`,
  (t) => `I Tested Every ${t} Method So You Don't Have To`,
  (t) => `The ${t} Mistake That's Costing You Hours`,
  (t) => `How I ${t} (Step by Step for Beginners)`,
  (t) => `${randomBetween(5,12)} ${t} Tips I Wish I Knew Sooner`,
  (t) => `${t}: What the Pros Don't Tell You`,
  (t) => `My Honest ${t} Review After ${randomBetween(3,12)} Months`,
  (t) => `The Only ${t} Video You'll Ever Need`,
];

const CONTEXT_PATTERNS = [
  (t) => `Hook: personal challenge format + time constraint. Works because viewers track progress. Pairs well with before/after thumbnails.`,
  (t) => `Evergreen listicle — high search intent, targets "how to" queries. Strong for SEO, lower VPH ceiling but long tail traffic.`,
  (t) => `Negative hook ("stop" / "mistakes") pattern — high CTR because it triggers loss aversion. Top outlier videos in this niche use this frame.`,
  (t) => `Curiosity gap with authority framing. "The truth" implies insider knowledge — drives clicks from viewers who feel they're missing something.`,
  (t) => `Budget angle narrows audience to decision-stage viewers — high engagement, strong comment sections. Dollar amount in title boosts CTR.`,
  (t) => `Comparison/testing format — viewers love watching someone else do the work. High watch time because they stay to see the winner.`,
  (t) => `Single-pain-point title — very specific, targets one frustration. Shorter video, but high satisfaction score and repeat traffic.`,
  (t) => `Tutorial format with approachable framing ("step by step", "beginners"). Targets search traffic, not browse — optimize description and tags.`,
  (t) => `Number-based listicle with emotional hook ("wish I knew"). Combines utility with regret framing — strong CTR + high save rate.`,
  (t) => `Authority positioning — implies expert-level knowledge. Works best if the thumbnail reinforces credibility (results, setup, credentials).`,
  (t) => `Long-term review format — viewers trust durability tests over first-impression reviews. High search volume for "[topic] review" keywords.`,
  (t) => `Bold claim title — polarizing by design. Drives comments (disagreement = engagement), but needs strong content to retain trust.`,
];

const CHANNEL_NAMES = [
  'SimpleTech', 'The Curious Creator', 'LifeWithMike', 'MinimalMind', 'DailyDose',
  'Alex Explains', 'ProTips Daily', 'Real Talk with Sam', 'The Side Project', 'NerdNest',
  'BudgetBoss', 'The Honest Review', 'CreatorLab', 'SmartStart', 'TinyDesk Studio',
  'NoFluff Guide', 'The Learn Channel', 'Pixel & Pen', 'Everyday Experiments', 'Level Up Life',
  'Unbox Reality', 'FocusForge', 'The Deep Dive', 'Clarity Co.', 'One Take Wonder',
];

function generateMockData(topic, filters) {
  const topicCap = topic.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const volumeNum = randomBetween(8000, 280000);
  const volumeLevel = volumeNum > 100000 ? 'High' : volumeNum > 30000 ? 'Medium' : 'Low';
  const compRoll = Math.random();
  const competitionLevel = compRoll < 0.35 ? 'Low' : compRoll < 0.7 ? 'Medium' : 'High';
  const competitionDesc = competitionLevel === 'Low' ? 'Few strong competitors' :
                          competitionLevel === 'Medium' ? 'Moderate competition' : 'Saturated — hard to rank';

  let overallScore;
  if (volumeLevel === 'High' && competitionLevel === 'Low') overallScore = randomBetween(78, 95);
  else if (volumeLevel === 'High' && competitionLevel === 'Medium') overallScore = randomBetween(55, 75);
  else if (volumeLevel === 'Medium' && competitionLevel === 'Low') overallScore = randomBetween(60, 80);
  else if (volumeLevel === 'Low' && competitionLevel === 'Low') overallScore = randomBetween(40, 60);
  else overallScore = randomBetween(20, 50);

  const overallLabel = overallScore >= 80 ? 'Very High — great opportunity' :
                       overallScore >= 60 ? 'High — worth targeting' :
                       overallScore >= 40 ? 'Moderate — competitive' :
                       overallScore >= 20 ? 'Low — tough to break through' : 'Very Low';

  const keywords = {
    volumeLevel,
    volumeNumber: volumeNum,
    competitionLevel,
    competitionDesc,
    overallScore,
    overallLabel,
    avgVph: randomBetween(40, 680)
  };

  const usedPatterns = new Set();
  const titles = [];
  while (titles.length < 6) {
    const idx = randomBetween(0, TITLE_PATTERNS.length - 1);
    if (usedPatterns.has(idx)) continue;
    usedPatterns.add(idx);
    titles.push({
      title: TITLE_PATTERNS[idx](topicCap),
      context: CONTEXT_PATTERNS[idx](topicCap),
      score: Math.max(40, Math.min(98, randomBetween(55, 96) - titles.length * randomBetween(1, 5)))
    });
  }
  titles.sort((a, b) => b.score - a.score);

  const usedChannels = new Set();
  const videos = [];
  while (videos.length < 5) {
    const ch = pick(CHANNEL_NAMES);
    if (usedChannels.has(ch)) continue;
    usedChannels.add(ch);

    const subCount = randomBetween(
      filters.subCap <= 100000 ? 2000 : 15000,
      filters.subCap
    );
    const isRising = filters.vphDirection === 'rising' ? true : Math.random() > 0.4;
    const outlier = randomFloat(1.2, 28, 1);
    const vph = isRising ? randomBetween(80, 1400) : randomBetween(5, 120);

    const viewCount = randomBetween(15000, 950000);
    const likeCount = Math.floor(viewCount * randomFloat(0.03, 0.08, 2));
    const commentCount = Math.floor(viewCount * randomFloat(0.003, 0.015, 3));

    const videoTitleTemplates = [
      `I Finally Figured Out ${topicCap} (and it changed everything)`,
      `${topicCap} — My ${randomBetween(3,12)} Month Update`,
      `Watch This Before You Try ${topicCap}`,
      `How ${topicCap} Actually Works in ${new Date().getFullYear()}`,
      `${topicCap} for Under $${randomBetween(20,200)} — Full Guide`,
      `${randomBetween(5,15)} ${topicCap} Hacks Nobody Shares`,
      `${topicCap}: Everything I Got Wrong`,
      `The BEST Way to Do ${topicCap} (Not What You Think)`,
      `Why I Quit ${topicCap} (Then Started Again)`,
      `${topicCap} — Beginner vs Pro Setup`,
    ];

    const thumbSeed = `${topic}-${ch}-${videos.length}-${randomBetween(0, 99999)}`;

    videos.push({
      title: pick(videoTitleTemplates),
      channel: ch,
      channelInitial: ch.charAt(0).toUpperCase(),
      subs: formatNumber(subCount) + ' subs',
      outlier,
      vph,
      vphDirection: isRising ? 'rising' : 'cooling',
      views: formatNumber(viewCount),
      likes: formatNumber(likeCount),
      comments: formatNumber(commentCount),
      duration: randomDuration(),
      publishedAgo: randomAgo(filters.timeWindow),
      thumbUrl: thumbUrlFor(thumbSeed),
      avatarUrl: avatarUrlFor(ch)
    });
  }

  videos.sort((a, b) => b.outlier - a.outlier);

  return { keywords, titles, videos };
}
