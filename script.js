// --- UI Element references ---
const appUserChip = document.getElementById('app-user-chip');
const hubUserChip = document.getElementById('hub-user-chip');
const homeBtn = document.getElementById('home-btn');
const signOutBtn = document.getElementById('sign-out-btn');

const sessionPanel = document.getElementById('session-panel');
const headerSubPill = document.getElementById('header-sub-pill');
const usageBar = document.getElementById('usage-bar');
const usageBarFill = document.getElementById('usage-bar-fill');
const usageCountText = document.getElementById('usage-count-text');
const manageBillingBtn = document.getElementById('manage-billing-btn');
const disconnectHubBtn = document.getElementById('disconnect-hub-btn');

const appLoginView = document.getElementById('app-login-view');
const appHomeView = document.getElementById('app-home-view');
const appView = document.getElementById('app-view');

const appLoginForm = document.getElementById('app-login-form');
const appUsernameInput = document.getElementById('app-username-input');
const appPasswordInput = document.getElementById('app-password-input');

const homeWelcome = document.getElementById('home-welcome');
const connectHubBtn = document.getElementById('connect-hub-btn');

const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');

const optimizeOverlay = document.getElementById('optimize-overlay');
const optimizeStageList = document.getElementById('optimize-stage-list');
const optimizeRingFill = document.getElementById('optimize-ring-fill');
const optimizeRingPct = document.getElementById('optimize-ring-pct');

const stepper = document.getElementById('stepper');
const quotaExceededPanel = document.getElementById('quota-exceeded-panel');
const quotaTierName = document.getElementById('quota-tier-name');
const quotaLimitText = document.getElementById('quota-limit-text');

// Wizard panels
const stepPanels = {
    1: document.getElementById('step-panel-source-dataset'),
    2: document.getElementById('step-panel-source-resource'),
    3: document.getElementById('step-panel-hub'),
    4: document.getElementById('step-panel-dataset'),
    5: document.getElementById('step-panel-resource'),
    6: document.getElementById('step-panel-done'),
};

// Step 1 — source dataset (browse the Clearly.Hub catalog)
const sourceDatasetSearchInput = document.getElementById('source-dataset-search-input');
const sourceDatasetHubFilter = document.getElementById('source-dataset-hub-filter');
const sourceDatasetList = document.getElementById('source-dataset-list');
const sourceDatasetError = document.getElementById('source-dataset-error');
const sourceDatasetNextBtn = document.getElementById('source-dataset-next-btn');
const sourceDatasetHomeBtn = document.getElementById('source-dataset-home-btn');

// Step 2 — source resource
const sourceResourceDatasetName = document.getElementById('source-resource-dataset-name');
const sourceResourceList = document.getElementById('source-resource-list');
const sourceResourceError = document.getElementById('source-resource-error');
const sourceResourceBackBtn = document.getElementById('source-resource-back-btn');
const sourceResourceNextBtn = document.getElementById('source-resource-next-btn');

// Step 3 — destination hub
const hubSearchInput = document.getElementById('hub-search-input');
const hubList = document.getElementById('hub-list');
const hubError = document.getElementById('hub-error');
const hubBackBtn = document.getElementById('hub-back-btn');
const hubNextBtn = document.getElementById('hub-next-btn');

// Step 4 — destination dataset
const datasetHubName = document.getElementById('dataset-hub-name');
const datasetList = document.getElementById('dataset-list');
const newDatasetForm = document.getElementById('new-dataset-form');
const newDatasetTitleInput = document.getElementById('new-dataset-title-input');
const newDatasetDescInput = document.getElementById('new-dataset-desc-input');
const newDatasetFindabilitySelect = document.getElementById('new-dataset-findability-select');
const datasetError = document.getElementById('dataset-error');
const datasetBackBtn = document.getElementById('dataset-back-btn');
const datasetNextBtn = document.getElementById('dataset-next-btn');

// Step 5 — publish (pre-filled from the source resource)
const resourceDatasetName = document.getElementById('resource-dataset-name');
const resourceNameInput = document.getElementById('resource-name-input');
const resourceFormatSelect = document.getElementById('resource-format-select');
const resourceUrlInput = document.getElementById('resource-url-input');
const resourceDescInput = document.getElementById('resource-desc-input');
const resourceError = document.getElementById('resource-error');
const resourceBackBtn = document.getElementById('resource-back-btn');
const resourceSubmitBtn = document.getElementById('resource-submit-btn');

// Step 6 — done
const doneSummary = document.getElementById('done-summary');
const registerAnotherBtn = document.getElementById('register-another-btn');

// Must match the platform's own accepted resource format keys exactly (lowercase, snake_case) —
// sending a differently-cased value (e.g. "GeoJSON" instead of "geojson") is rejected by the API.
const BASE_RESOURCE_FORMATS = [
    '3dpointclouds', '3dterrain', '3dtiles', 'api', 'api_documentation', 'bim',
    'geojson', 'sensor_data_mqtt', 'sensor_data_rest', 'sensor_data_websocket',
    'tilejson', 'tms', 'wfs', 'wms', 'wmts', 'xyz',
];

// --- Wizard state ---
let datasetCatalog = [];           // cached, unfiltered catalog for Step 1's client-side search/filter
let selectedSourceDataset = null;  // { _id, title, ownerHub: { _id, name } }
let selectedSourceResource = null; // { _id, name, format, url, description }
let selectedHub = null;            // { _id, name } — destination hub
let selectedDataset = null;        // { _id, title, isNew } — destination dataset

// --- API Call Log (dev console) ---
const apiCallLog = [];

function logApiCall(method, label, statusCode) {
    const entry = { method, label, statusCode, time: new Date() };
    apiCallLog.unshift(entry);

    const countEl = document.getElementById('api-log-count');
    const listEl = document.getElementById('api-log-list');
    if (!listEl) return;

    if (countEl) {
        countEl.textContent = apiCallLog.length;
        countEl.classList.remove('hidden');
    }

    const empty = listEl.querySelector('.log-empty-msg');
    if (empty) empty.remove();

    const ok = statusCode >= 200 && statusCode < 300;
    const methodClass = method === 'GET' ? 'log-method-get' : 'log-method-post';
    const statusClass = ok ? 'log-status-ok' : 'log-status-err';
    const timeStr = entry.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const el = document.createElement('div');
    el.className = 'log-entry';
    el.innerHTML = `
        <span class="log-method ${methodClass}">${method}</span>
        <div class="log-entry-details">
            <div class="log-endpoint">${label}</div>
            <div class="log-meta"><span class="${statusClass}">${statusCode}</span> &middot; ${timeStr}</div>
        </div>`;
    listEl.prepend(el);
}

// --- Config ---
const CLIENT_ID = "539udvithf2l0hg78o46ojh3k5";
const REDIRECT_URI = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
    ? window.location.href.split('?')[0].split('#')[0]
    : "https://fi-support.github.io/GeoSync/";
const COGNITO_USER_POOL_DOMAIN = "auth.clearly.app";
const OAUTH_TOKEN_ENDPOINT = `https://${COGNITO_USER_POOL_DOMAIN}/oauth2/token`;
const BASE_COMPONENT_URL = "https://hub.clearly.app/components/";
const GRAPHQL_ENDPOINT = "https://hub.clearly.app/graphql";

// --- Small helpers ---
function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function showError(el, msg) { el.textContent = msg; el.classList.remove('hidden'); }
function hideError(el) { el.classList.add('hidden'); }

function showLoading(text) {
    loadingText.textContent = text || 'Working…';
    loadingOverlay.classList.remove('hidden');
}
function hideLoading() { loadingOverlay.classList.add('hidden'); }

function getUserEmail() {
    try {
        const idToken = localStorage.getItem('idToken');
        if (!idToken) return null;
        const payload = JSON.parse(atob(idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.email || payload['cognito:username'] || null;
    } catch (e) { return null; }
}

function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

async function sha256(plain) {
    const data = new TextEncoder().encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
}

function base64urlencode(buffer) {
    let s = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateCodeChallenge(verifier) {
    return base64urlencode(await sha256(verifier));
}

function normalizeSubscriptionName(rawName) {
    return (rawName || '').toUpperCase().trim();
}

// --- Subscription-gated usage (how many optimizations the current plan allows) ---
const TIER_LIMITS = { STARTER: 1, PROFESSIONAL: 3, ENTERPRISE: Infinity };

function formatTierName(subName) {
    const s = (subName || 'NONE').toUpperCase();
    return s === 'NONE' ? 'No plan' : s.charAt(0) + s.slice(1).toLowerCase();
}

function getTierLimit() {
    const tier = (localStorage.getItem('subscriptionName') || '').toUpperCase();
    return TIER_LIMITS[tier] ?? 1; // unrecognized tiers default to the most conservative limit
}

function getUsageCount() {
    return parseInt(localStorage.getItem('optimizeUsageCount') || '0', 10);
}

function getRemainingOptimizations() {
    return Math.max(0, getTierLimit() - getUsageCount()); // Infinity - finite = Infinity, so Enterprise never runs out
}

function updateUsageDisplay() {
    const subName = (localStorage.getItem('subscriptionName') || 'NONE').toUpperCase();
    headerSubPill.textContent = formatTierName(subName);

    const used = getUsageCount();
    const limit = getTierLimit();

    if (limit === Infinity) {
        usageBar.classList.add('hidden');
        usageCountText.textContent = `${used} optimizations used · unlimited`;
        return;
    }
    usageBar.classList.remove('hidden');
    usageCountText.textContent = `${used} / ${limit} optimizations used`;
    usageBarFill.style.width = `${Math.min(100, (used / limit) * 100)}%`;
    usageBarFill.classList.toggle('usage-bar-full', used >= limit);
}

// --- GraphQL ---
async function graphqlRequest(query, variables) {
    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const response = await fetch(GRAPHQL_ENDPOINT, { method: 'POST', headers, body: JSON.stringify({ query, variables }) });
    const statusCode = response.status;
    const opMatch = query.match(/(?:query|mutation)\s+(\w+)/i);
    const opName = opMatch ? opMatch[1] : 'graphql';
    logApiCall('POST', `GraphQL · ${opName}`, statusCode);
    if (!response.ok) throw new Error(`GraphQL request failed: ${response.status}`);
    const result = await response.json();
    if (result.errors) throw new Error(result.errors[0].message);
    return result.data;
}

// --- Wizard: Step navigation ---
function goToStep(n) {
    for (let i = 1; i <= 6; i++) stepPanels[i].classList.toggle('hidden', i !== n);
    document.querySelectorAll('.step-dot-wrap').forEach(el => {
        const s = parseInt(el.dataset.step, 10);
        el.classList.toggle('active', s === n);
        el.classList.toggle('done', s < n);
    });
}

// Keeps the format select's known options clean, but preserves an unrecognized
// source format instead of silently defaulting to GeoJSON.
function setResourceFormat(value) {
    Array.from(resourceFormatSelect.options).forEach(o => {
        if (!BASE_RESOURCE_FORMATS.includes(o.value)) resourceFormatSelect.remove(o.index);
    });
    const match = BASE_RESOURCE_FORMATS.find(f => f.toLowerCase() === String(value || '').toLowerCase());
    if (match) { resourceFormatSelect.value = match; return; }
    if (value) { resourceFormatSelect.add(new Option(value, value, true, true)); resourceFormatSelect.value = value; return; }
    resourceFormatSelect.value = 'geojson';
}

// Carries the chosen source resource's details into the Step 5 publish form.
function prefillResourceForm() {
    resourceNameInput.value = selectedSourceResource?.name || '';
    resourceUrlInput.value = selectedSourceResource?.url || '';
    resourceDescInput.value = selectedSourceResource?.description || '';
    setResourceFormat(selectedSourceResource?.format);
}

function resetWizardForms() {
    newDatasetTitleInput.value = '';
    newDatasetDescInput.value = '';
    newDatasetFindabilitySelect.value = 'PUBLIC';
    newDatasetForm.classList.add('hidden');
    resourceNameInput.value = '';
    resourceUrlInput.value = '';
    resourceDescInput.value = '';
    setResourceFormat(null);
    hideError(sourceDatasetError); hideError(sourceResourceError);
    hideError(hubError); hideError(datasetError); hideError(resourceError);
}

// Blocks the entire wizard except the session panel's "Manage plan" / "Disconnect
// Clearly.Hub" (and the header's "Sign out") once the plan's optimization quota is spent.
function showQuotaExceeded() {
    stepper.classList.add('hidden');
    for (let i = 1; i <= 6; i++) stepPanels[i].classList.add('hidden');
    quotaTierName.textContent = formatTierName(localStorage.getItem('subscriptionName'));
    quotaLimitText.textContent = String(getTierLimit());
    quotaExceededPanel.classList.remove('hidden');
}

function resetWizard() {
    if (getRemainingOptimizations() <= 0) { showQuotaExceeded(); return; }

    quotaExceededPanel.classList.add('hidden');
    stepper.classList.remove('hidden');

    selectedSourceDataset = null;
    selectedSourceResource = null;
    selectedHub = null;
    selectedDataset = null;
    sourceDatasetNextBtn.disabled = true;
    sourceResourceNextBtn.disabled = true;
    hubNextBtn.disabled = true;
    datasetNextBtn.disabled = true;
    sourceDatasetSearchInput.value = '';
    sourceDatasetHubFilter.value = '';
    resetWizardForms();
    goToStep(1);
    loadSourceCatalog();
}

// Runs a fake "optimizing" sequence between picking a source resource (Step 2) and
// choosing where to publish it (Step 3) — no real processing happens here, it's all show.
const OPTIMIZE_STAGES = [
    'Analyzing source geometry',
    'Simplifying vertex density',
    'Reprojecting coordinate system',
    'Compressing tile payloads',
    'Validating optimized output',
];
const OPTIMIZE_RING_CIRCUMFERENCE = 106.8; // matches the SVG circle's r=17 in index.html

async function runOptimizeAnimation() {
    optimizeStageList.innerHTML = OPTIMIZE_STAGES.map(label => `
        <li class="optimize-stage"><span class="optimize-stage-icon"></span><span class="optimize-stage-label">${escapeHtml(label)}</span></li>
    `).join('');
    optimizeRingFill.style.strokeDashoffset = String(OPTIMIZE_RING_CIRCUMFERENCE);
    optimizeRingPct.textContent = '0%';
    optimizeOverlay.classList.remove('hidden');

    const stageItems = Array.from(optimizeStageList.children);
    for (let i = 0; i < stageItems.length; i++) {
        stageItems[i].classList.add('active');
        await new Promise(r => setTimeout(r, 900));
        stageItems[i].classList.remove('active');
        stageItems[i].classList.add('done');
        const pct = Math.round(((i + 1) / stageItems.length) * 100);
        optimizeRingFill.style.strokeDashoffset = String(OPTIMIZE_RING_CIRCUMFERENCE * (1 - pct / 100));
        optimizeRingPct.textContent = `${pct}%`;
    }
    await new Promise(r => setTimeout(r, 400)); // brief pause on the all-done state
    optimizeOverlay.classList.add('hidden');
}

// --- Step 1: Source dataset — browse the Clearly.Hub catalog ---
async function loadSourceCatalog() {
    sourceDatasetList.innerHTML = '<p class="option-list-empty">Loading the catalog…</p>';
    sourceDatasetNextBtn.disabled = true;
    try {
        const query = `query DatasetCatalog($limit: Int) {
            datasets(limit: $limit) {
                results { _id title description ownerHub { _id name } }
            }
        }`;
        const data = await graphqlRequest(query, { limit: 300 });
        datasetCatalog = data?.datasets?.results || [];
        if (!datasetCatalog.length) {
            sourceDatasetList.innerHTML = '<p class="option-list-empty">No datasets found in the catalog.</p>';
            return;
        }
        populateSourceHubFilter();
        renderSourceDatasetList();
    } catch (e) {
        console.error('Failed to load dataset catalog:', e);
        sourceDatasetList.innerHTML = '<p class="option-list-empty">Failed to load the catalog.</p>';
        showError(sourceDatasetError, e.message);
    }
}

function populateSourceHubFilter() {
    const hubs = new Map();
    datasetCatalog.forEach(d => { if (d.ownerHub) hubs.set(d.ownerHub._id, d.ownerHub.name); });
    sourceDatasetHubFilter.innerHTML = '<option value="">All owner hubs</option>';
    Array.from(hubs.entries()).sort((a, b) => a[1].localeCompare(b[1])).forEach(([id, name]) => {
        sourceDatasetHubFilter.add(new Option(name, id));
    });
}

function renderSourceDatasetList() {
    const q = sourceDatasetSearchInput.value.trim().toLowerCase();
    const hubFilter = sourceDatasetHubFilter.value;
    const filtered = datasetCatalog.filter(d => {
        if (hubFilter && d.ownerHub?._id !== hubFilter) return false;
        if (q && !d.title.toLowerCase().includes(q)) return false;
        return true;
    });

    sourceDatasetList.innerHTML = '';
    if (!filtered.length) {
        sourceDatasetList.innerHTML = '<p class="option-list-empty">No datasets match.</p>';
        return;
    }
    filtered.forEach(d => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'option-card';
        card.dataset.datasetId = d._id;
        const meta = d.ownerHub ? `<div class="option-card-meta">${escapeHtml(d.ownerHub.name)}</div>` : '';
        card.innerHTML = `<span class="option-radio"></span><span class="option-card-body"><div class="option-card-title">${escapeHtml(d.title)}</div>${meta}</span>`;
        card.addEventListener('click', () => selectSourceDataset(d, card));
        sourceDatasetList.appendChild(card);
    });
    if (selectedSourceDataset) {
        const row = sourceDatasetList.querySelector(`[data-dataset-id="${selectedSourceDataset._id}"]`);
        if (row) row.classList.add('selected');
    }
}

function selectSourceDataset(d, cardEl) {
    selectedSourceDataset = { _id: d._id, title: d.title, ownerHub: d.ownerHub };
    sourceDatasetList.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
    cardEl.classList.add('selected');
    sourceDatasetNextBtn.disabled = false;
    hideError(sourceDatasetError);
}

// --- Step 2: Source resource — which resource on that dataset to optimize ---
async function loadSourceResources() {
    sourceResourceList.innerHTML = '<p class="option-list-empty">Loading resources…</p>';
    sourceResourceNextBtn.disabled = true;
    selectedSourceResource = null;
    hideError(sourceResourceError);
    if (getRemainingOptimizations() <= 0) {
        showError(sourceResourceError, `You've used all ${getTierLimit()} optimizations included in your ${formatTierName(localStorage.getItem('subscriptionName'))} plan. Manage your plan to unlock more.`);
    }
    try {
        const query = `query DatasetDetail($_id: String!, $activeHubId: String) {
            dataset(_id: $_id, activeHubId: $activeHubId) {
                _id title
                resources { _id name format url description }
            }
        }`;
        const variables = { _id: selectedSourceDataset._id, activeHubId: selectedSourceDataset.ownerHub?._id };
        const data = await graphqlRequest(query, variables);
        const resources = data?.dataset?.resources || [];
        sourceResourceList.innerHTML = '';
        if (!resources.length) {
            sourceResourceList.innerHTML = '<p class="option-list-empty">This dataset has no resources yet.</p>';
            return;
        }
        resources.forEach(r => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'option-card';
            const metaParts = [r.format || 'Unknown format'];
            if (r.url) metaParts.push(r.url);
            card.innerHTML = `<span class="option-radio"></span><span class="option-card-body"><div class="option-card-title">${escapeHtml(r.name || 'Untitled resource')}</div><div class="option-card-meta">${escapeHtml(metaParts.join(' · '))}</div></span>`;
            card.addEventListener('click', () => selectSourceResource(r, card));
            sourceResourceList.appendChild(card);
        });
    } catch (e) {
        console.error('Failed to load resources:', e);
        sourceResourceList.innerHTML = '<p class="option-list-empty">Failed to load resources.</p>';
        showError(sourceResourceError, e.message);
    }
}

function selectSourceResource(r, cardEl) {
    selectedSourceResource = r;
    sourceResourceList.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
    cardEl.classList.add('selected');
    if (getRemainingOptimizations() > 0) {
        sourceResourceNextBtn.disabled = false;
        hideError(sourceResourceError);
    }
}

// --- Step 3: Destination hub selection (rendered as a hierarchy, like the platform's own hub tree) ---
let hubTree = []; // full, unfiltered tree — kept so search can re-filter without refetching

async function loadHubs() {
    hubList.innerHTML = '<p class="option-list-empty">Loading your hubs…</p>';
    hubNextBtn.disabled = true;
    hubSearchInput.value = '';
    try {
        const query = `query Hubs { hubs(rootHubsOnly: false) {
            results {
                ... on Hub { _id name parent { _id } }
                ... on PublicHub { _id name parent { _id } }
            }
        } }`;
        const data = await graphqlRequest(query, {});
        const hubs = data?.hubs?.results || [];
        if (!hubs.length) {
            hubList.innerHTML = '<p class="option-list-empty">No hubs found for your account.</p>';
            return;
        }
        hubTree = buildHubTree(hubs);
        renderHubList('');
    } catch (e) {
        console.error('Failed to load hubs:', e);
        hubList.innerHTML = '<p class="option-list-empty">Failed to load hubs.</p>';
        showError(hubError, e.message);
    }
}

// Turns the flat `hubs` list (each with an optional parent._id) into a nested tree.
function buildHubTree(hubs) {
    const byId = new Map(hubs.map(h => [h._id, { _id: h._id, name: h.name, children: [] }]));
    const roots = [];
    hubs.forEach(h => {
        const node = byId.get(h._id);
        const parentId = h.parent?._id;
        if (parentId && byId.has(parentId)) {
            byId.get(parentId).children.push(node);
        } else {
            roots.push(node);
        }
    });
    const byName = (a, b) => a.name.localeCompare(b.name);
    const sortRec = list => { list.sort(byName); list.forEach(n => sortRec(n.children)); };
    sortRec(roots);
    return roots;
}

// Keeps a node if its own name matches, or if any descendant matches.
function filterHubTree(nodes, q) {
    if (!q) return nodes;
    const out = [];
    nodes.forEach(node => {
        const matchingChildren = filterHubTree(node.children, q);
        if (node.name.toLowerCase().includes(q) || matchingChildren.length) {
            out.push({ ...node, children: matchingChildren });
        }
    });
    return out;
}

function renderHubList(query) {
    const q = query.trim().toLowerCase();
    const filtered = filterHubTree(hubTree, q);
    hubList.innerHTML = '';
    if (!filtered.length) {
        hubList.innerHTML = '<p class="option-list-empty">No hubs match your search.</p>';
        return;
    }
    // While searching, force every matching branch open so results are actually visible.
    hubList.appendChild(renderHubTree(filtered, 0, !!q));
    if (selectedHub) {
        const row = hubList.querySelector(`[data-hub-id="${selectedHub._id}"]`);
        if (row) row.classList.add('selected');
    }
}

function renderHubTree(nodes, depth, forceExpanded) {
    const wrap = document.createElement('div');
    wrap.className = depth === 0 ? 'hub-tree-root' : (forceExpanded ? 'hub-children hub-children-visible' : 'hub-children');
    nodes.forEach(node => {
        const item = document.createElement('div');
        item.className = 'hub-tree-node';

        const hasChildren = node.children.length > 0;
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'option-card';
        row.dataset.hubId = node._id;
        const icon = forceExpanded ? '&#9662;' : '&#9656;';
        row.innerHTML = `${hasChildren ? `<span class="hub-toggle">${icon}</span>` : '<span class="hub-toggle hub-toggle-spacer"></span>'}<span class="option-radio"></span><span class="option-card-body"><div class="option-card-title">${escapeHtml(node.name)}</div></span>`;
        row.addEventListener('click', (e) => {
            if (hasChildren && e.target.closest('.hub-toggle')) {
                toggleHubChildren(item, row.querySelector('.hub-toggle'));
                return;
            }
            selectHub(node, row);
        });
        item.appendChild(row);

        if (hasChildren) item.appendChild(renderHubTree(node.children, depth + 1, forceExpanded));
        wrap.appendChild(item);
    });
    return wrap;
}

function toggleHubChildren(itemEl, toggleEl) {
    const childWrap = itemEl.querySelector(':scope > .hub-children');
    if (!childWrap) return;
    const isVisible = childWrap.classList.toggle('hub-children-visible');
    toggleEl.innerHTML = isVisible ? '&#9662;' : '&#9656;';
}

function selectHub(hub, rowEl) {
    selectedHub = hub;
    hubList.querySelectorAll('.option-card').forEach(r => r.classList.remove('selected'));
    rowEl.classList.add('selected');
    hubNextBtn.disabled = false;
    hideError(hubError);
}

// --- Step 2: Dataset selection / creation ---
async function loadDatasets(hubId) {
    datasetList.innerHTML = '<p class="option-list-empty">Loading datasets…</p>';
    datasetNextBtn.disabled = true;
    selectedDataset = null;
    newDatasetForm.classList.add('hidden');
    try {
        const query = `query DatasetsForHub($ownerHubId: String, $activeHubId: String) {
            datasets(query: { ownerHubId: $ownerHubId }, activeHubId: $activeHubId, limit: 200) {
                results { _id title description }
            }
        }`;
        const data = await graphqlRequest(query, { ownerHubId: hubId, activeHubId: hubId });
        const datasets = data?.datasets?.results || [];

        datasetList.innerHTML = '';
        datasets.forEach(d => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'option-card';
            const meta = d.description ? `<div class="option-card-meta">${escapeHtml(d.description)}</div>` : '';
            card.innerHTML = `<span class="option-radio"></span><span class="option-card-body"><div class="option-card-title">${escapeHtml(d.title)}</div>${meta}</span>`;
            card.addEventListener('click', () => selectDataset({ _id: d._id, title: d.title, isNew: false }, card));
            datasetList.appendChild(card);
        });

        const newCard = document.createElement('button');
        newCard.type = 'button';
        newCard.className = 'option-card option-card-new';
        newCard.innerHTML = `<span class="option-radio"></span><span class="option-card-body"><div class="option-card-title">+ Create a new dataset</div></span>`;
        newCard.addEventListener('click', () => selectDataset({ isNew: true }, newCard));
        datasetList.appendChild(newCard);
    } catch (e) {
        console.error('Failed to load datasets:', e);
        datasetList.innerHTML = '<p class="option-list-empty">Failed to load datasets.</p>';
        showError(datasetError, e.message);
    }
}

function selectDataset(ds, cardEl) {
    selectedDataset = ds;
    Array.from(datasetList.children).forEach(c => c.classList && c.classList.remove('selected'));
    cardEl.classList.add('selected');
    newDatasetForm.classList.toggle('hidden', !ds.isNew);
    datasetNextBtn.disabled = false;
    hideError(datasetError);
}

async function handleDatasetNext() {
    hideError(datasetError);
    if (!selectedDataset) return;

    if (!selectedDataset.isNew) {
        resourceDatasetName.textContent = selectedDataset.title;
        prefillResourceForm();
        goToStep(5);
        return;
    }

    const title = newDatasetTitleInput.value.trim();
    if (!title) { showError(datasetError, 'Please enter a title for the new dataset.'); return; }
    const description = newDatasetDescInput.value.trim();
    const findability = newDatasetFindabilitySelect.value;

    datasetNextBtn.disabled = true;
    showLoading('Creating dataset…');
    try {
        const mutation = `mutation CreateDataset($dataset: DatasetInput!) {
            createDataset(dataset: $dataset) { _id title }
        }`;
        const variables = { dataset: { title, description: description || undefined, ownerHubId: selectedHub._id, findability } };
        const data = await graphqlRequest(mutation, variables);
        const created = data.createDataset;
        selectedDataset = { _id: created._id, title: created.title, isNew: false };
        resourceDatasetName.textContent = created.title;
        prefillResourceForm();
        hideLoading();
        goToStep(5);
    } catch (e) {
        console.error('Failed to create dataset:', e);
        hideLoading();
        showError(datasetError, `Failed to create dataset: ${e.message}`);
    } finally {
        datasetNextBtn.disabled = false;
    }
}

// --- Step 5: Publish the optimized resource ---
async function handleResourceSubmit() {
    hideError(resourceError);
    const name = resourceNameInput.value.trim();
    const format = resourceFormatSelect.value;
    const url = resourceUrlInput.value.trim();
    const description = resourceDescInput.value.trim();

    if (!name) { showError(resourceError, 'Please give this dataset a name.'); return; }
    if (!url) { showError(resourceError, 'Please provide the source data URL.'); return; }

    resourceSubmitBtn.disabled = true;
    showLoading('Publishing to Clearly.Hub…');

    try {
        const mutation = `mutation AddResource($datasetId: String!, $resource: DatasetResourceInput!) {
            addDatasetResource(datasetId: $datasetId, resource: $resource) { _id name format url }
        }`;
        const variables = { datasetId: selectedDataset._id, resource: { name, format, url, description: description || undefined } };
        const data = await graphqlRequest(mutation, variables);
        renderDoneSummary(data.addDatasetResource);
        hideLoading();
        goToStep(6);
    } catch (e) {
        console.error('Failed to publish resource:', e);
        hideLoading();
        showError(resourceError, `Failed to publish: ${e.message}`);
    } finally {
        resourceSubmitBtn.disabled = false;
    }
}

function renderDoneSummary(resource) {
    doneSummary.innerHTML = `
        <div><strong>Optimized from:</strong> ${escapeHtml(selectedSourceDataset.title)} &rarr; ${escapeHtml(selectedSourceResource.name || 'resource')}</div>
        <div><strong>Destination hub:</strong> ${escapeHtml(selectedHub.name)}</div>
        <div><strong>Destination dataset:</strong> ${escapeHtml(selectedDataset.title)}</div>
        <div><strong>Optimized dataset:</strong> ${escapeHtml(resource.name)} <code>${escapeHtml(resource.format)}</code></div>
        <div><strong>Resource ID:</strong> <code>${escapeHtml(resource._id)}</code></div>
    `;
}

// --- View Switching (two-layer: GeoSync app session, then Clearly.Hub connection) ---
function showAppLogin() {
    hideLoading();
    appLoginView.classList.remove('hidden');
    appHomeView.classList.add('hidden');
    appView.classList.add('hidden');

    appUserChip.classList.add('hidden');
    hubUserChip.classList.add('hidden');
    homeBtn.classList.add('hidden');
    signOutBtn.classList.add('hidden');
    sessionPanel.classList.add('hidden');
}

function showAppHome(appUser) {
    hideLoading();
    appLoginView.classList.add('hidden');
    appHomeView.classList.remove('hidden');
    appView.classList.add('hidden');

    homeWelcome.textContent = `// welcome back, ${appUser}`;
    appUserChip.textContent = `App: ${appUser}`;
    appUserChip.classList.remove('hidden');
    hubUserChip.classList.add('hidden');
    homeBtn.classList.add('hidden');
    signOutBtn.classList.remove('hidden');
    sessionPanel.classList.add('hidden');
}

function showWizardApp(appUser) {
    hideLoading();
    appLoginView.classList.add('hidden');
    appHomeView.classList.add('hidden');
    appView.classList.remove('hidden');

    appUserChip.textContent = `App: ${appUser}`;
    appUserChip.classList.remove('hidden');

    const email = getUserEmail();
    if (email) { hubUserChip.textContent = `${email}`; hubUserChip.classList.remove('hidden'); }

    homeBtn.classList.remove('hidden');
    signOutBtn.classList.remove('hidden');

    sessionPanel.classList.remove('hidden');
    headerSubPill.classList.remove('hidden');
    updateUsageDisplay();

    resetWizard();
}

// Jumps back to the app's own home screen without touching the Clearly.Hub connection.
function handleGoHome() {
    showAppHome(localStorage.getItem('appUser'));
}

// Resolves this app's Clearly.Hub App ID, then checks for an active subscription.
async function checkAndApplySubscription() {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    try {
        const appsRes = await fetch(
            `https://hub.clearly.app/api/apps?ssoClientId=${encodeURIComponent(CLIENT_ID)}`,
            { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
        );
        if (!appsRes.ok) return false;
        logApiCall('GET', 'REST · apps (resolve app id)', appsRes.status);
        const appsData = await appsRes.json();
        const appId = appsData?.results?.[0]?._id;
        if (!appId) return false;

        const subRes = await fetch(
            `https://hub.clearly.app/api/me/app-subscriptions/${appId}`,
            { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
        );
        if (!subRes.ok) return false;
        logApiCall('GET', 'REST · me/app-subscriptions', subRes.status);
        const subData = await subRes.json();
        const activeSub = (subData?.userAppSubscriptions || [])[0];
        if (activeSub?.subscriptionModel) {
            const tierKey = activeSub.subscriptionModel.externalReference || activeSub.subscriptionModel.name;
            localStorage.setItem('subscriptionName', normalizeSubscriptionName(tierKey));
            return true;
        }
        return false;
    } catch (e) {
        console.warn('Could not check subscription status:', e);
        return false;
    }
}

// Central router: GeoSync session first, Clearly.Hub connection second.
async function render() {
    const appUser = localStorage.getItem('appUser');
    if (!appUser) { showAppLogin(); return; }

    const hubToken = localStorage.getItem('accessToken');
    if (!hubToken) { showAppHome(appUser); return; }

    if (localStorage.getItem('subscriptionName')) { showWizardApp(appUser); return; }

    showLoading('Checking your subscription…');
    const hasSubscription = await checkAndApplySubscription();
    if (hasSubscription) {
        showWizardApp(appUser);
    } else {
        showLoading('Redirecting to plan selection…');
        redirectToBilling();
    }
}

// --- GeoSync app login (fake — any credentials are accepted) ---
function handleAppLogin(e) {
    e.preventDefault();
    const username = appUsernameInput.value.trim() || 'demo-user';
    localStorage.setItem('appUser', username);
    appLoginForm.reset();
    render();
}

// --- OAuth & Billing (Clearly.Hub connection) ---
function parseBillingData(dataParam) {
    if (!dataParam) return null;
    try {
        const parts = dataParam.split('.');
        if (parts.length === 3) {
            const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const pad = (4 - b64.length % 4) % 4;
            return JSON.parse(atob(b64 + '='.repeat(pad)));
        }
        return JSON.parse(atob(dataParam));
    } catch (e) {
        console.error('[Billing] parseBillingData failed:', e);
        return null;
    }
}

async function initiateLogin() {
    const verifier = generateRandomString(128);
    sessionStorage.setItem('pkce_code_verifier', verifier);
    const challenge = await generateCodeChallenge(verifier);
    const url = `https://${COGNITO_USER_POOL_DOMAIN}/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=openid+profile+email&code_challenge=${challenge}&code_challenge_method=S256`;
    window.location.href = url;
}

async function exchangeCodeForTokens(code, verifier) {
    showLoading('Connecting Clearly.Hub…');
    const body = new URLSearchParams({ grant_type: 'authorization_code', client_id: CLIENT_ID, code, redirect_uri: REDIRECT_URI, code_verifier: verifier });
    try {
        const response = await fetch(OAUTH_TOKEN_ENDPOINT, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error_description || 'Token exchange failed'); }
        const data = await response.json();
        logApiCall('POST', 'OAuth2 Token Exchange · Cognito', response.status);
        localStorage.setItem('accessToken', data.access_token);
        localStorage.setItem('idToken', data.id_token);
        // Always re-prompt subscription selection on every Clearly.Hub login,
        // even for a returning user who already picked a plan before.
        localStorage.removeItem('subscriptionName');
        showLoading('Redirecting to plan selection…');
        redirectToBilling();
    } catch (e) {
        console.error('Token exchange error:', e);
        await render();
    }
}

// Signs out of everything: the GeoSync app session AND, if connected, Clearly.Hub.
function handleSignOut() {
    const hadHubToken = !!localStorage.getItem('accessToken');
    localStorage.clear();
    sessionStorage.clear();
    if (hadHubToken) {
        // Also end the Clearly.Hub session, not just forget the token locally.
        const url = `https://${COGNITO_USER_POOL_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(REDIRECT_URI)}`;
        window.location.href = url;
    } else {
        render();
    }
}

// Disconnects Clearly.Hub only — stays signed into the GeoSync app itself.
function handleDisconnectHub() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('subscriptionName');
    render();
}

function redirectToBilling() {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const payload = btoa(JSON.stringify({ actions: ["SELECT_SUBSCRIPTION"], redirect_url: REDIRECT_URI, client_id: CLIENT_ID }));
    window.location.href = `${BASE_COMPONENT_URL}${payload}`;
}

// --- Event Listeners ---
appLoginForm.addEventListener('submit', handleAppLogin);
connectHubBtn.addEventListener('click', initiateLogin);
signOutBtn.addEventListener('click', handleSignOut);
disconnectHubBtn.addEventListener('click', handleDisconnectHub);
manageBillingBtn.addEventListener('click', redirectToBilling);
homeBtn.addEventListener('click', handleGoHome);

sourceDatasetSearchInput.addEventListener('input', renderSourceDatasetList);
sourceDatasetHubFilter.addEventListener('change', renderSourceDatasetList);
sourceDatasetHomeBtn.addEventListener('click', handleGoHome);
sourceDatasetNextBtn.addEventListener('click', () => {
    if (!selectedSourceDataset) return;
    sourceResourceDatasetName.textContent = selectedSourceDataset.title;
    goToStep(2);
    loadSourceResources();
});

sourceResourceBackBtn.addEventListener('click', () => goToStep(1));
sourceResourceNextBtn.addEventListener('click', async () => {
    if (!selectedSourceResource) return;
    hideError(sourceResourceError);
    if (getRemainingOptimizations() <= 0) {
        showError(sourceResourceError, `You've used all ${getTierLimit()} optimizations included in your ${formatTierName(localStorage.getItem('subscriptionName'))} plan. Manage your plan to unlock more.`);
        return;
    }
    localStorage.setItem('optimizeUsageCount', String(getUsageCount() + 1));
    updateUsageDisplay();
    await runOptimizeAnimation();
    goToStep(3);
    loadHubs();
});

hubSearchInput.addEventListener('input', () => renderHubList(hubSearchInput.value));
hubBackBtn.addEventListener('click', () => goToStep(2));
hubNextBtn.addEventListener('click', () => {
    if (!selectedHub) return;
    datasetHubName.textContent = selectedHub.name;
    goToStep(4);
    loadDatasets(selectedHub._id);
});
datasetBackBtn.addEventListener('click', () => goToStep(3));
datasetNextBtn.addEventListener('click', handleDatasetNext);

resourceBackBtn.addEventListener('click', () => goToStep(4));
resourceSubmitBtn.addEventListener('click', handleResourceSubmit);

registerAnotherBtn.addEventListener('click', resetWizard);

// --- Page Load: OAuth / Billing Redirect Handling ---
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
    const dataFromBilling = urlParams.get('data');

    if (code || dataFromBilling) window.history.replaceState({}, document.title, window.location.pathname);

    if (dataFromBilling) {
        const d = parseBillingData(dataFromBilling);
        if (d?.response?.subscription) {
            const sub = d.response.subscription;
            const tierKey = sub.externalReference || sub.name;
            if (tierKey) {
                localStorage.setItem('subscriptionName', normalizeSubscriptionName(tierKey));
                // A freshly (re)confirmed plan starts a new optimization allowance.
                localStorage.setItem('optimizeUsageCount', '0');
            }
        }
    }

    if (code && codeVerifier) {
        exchangeCodeForTokens(code, codeVerifier);
    } else {
        render();
    }
});
