document.addEventListener('DOMContentLoaded', function() {
    // ==== 1. إعلان جميع متغيّرات عناصر الـ DOM أولاً ====
    const ownerInput = document.getElementById('owner');
    const repoInput = document.getElementById('repo');
    const tokenInput = document.getElementById('token');
    const statusSelect = document.getElementById('status');
    const fetchBtn = document.getElementById('fetchBtn');
    const refreshBtn = document.getElementById('refresh');
    const runsContainer = document.getElementById('runsContainer');
    const resultsContainer = document.getElementById('resultsContainer');
    const FailedContainer = document.getElementById('FailedContainer');
    const Failedtext = document.getElementById('Failedp');
    const Failedtitle = document.getElementById('Failedh1');
    const resultsList = document.getElementById('resultsList');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const successContainer = document.getElementById('successContainer');
    const runCount = document.getElementById('runCount');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    const progressBar = document.getElementById('progressBar');
    const fetchProgressBar = document.getElementById('fetchProgressBar');
    const satiricalMessage = document.getElementById('satiricalMessage');
    const toastContainer = document.getElementById('toastContainer');
    const confirmModal = document.getElementById('confirmModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const cancelBtn = document.getElementById('cancelBtn');
    const confirmBtn = document.getElementById('confirmBtn');
    const progressContainer = document.getElementById('progressContainer');
    const backToSearchBtn = document.getElementById('backToSearchBtn');

    // ==== 2. إجعل زر الريفريش مخفي في البداية ====
    let hasFetched = false;
    refreshBtn.style.display = 'none';

    // ==== 3. تحميل القيم المحفوظة من localStorage ====
    ownerInput.value = localStorage.getItem('owner') || '';
    repoInput.value = localStorage.getItem('repo') || '';
    tokenInput.value = localStorage.getItem('token') || '';
    statusSelect.value = localStorage.getItem('status') || 'all';

    // ==== 4. رصف الرسائل الساخرة ====
    const satiricalMessages = [
        "While you wait, politicians are busy creating new workflows in the background...",
        "This is taking longer than fulfilling a campaign promise!",
        "Loading... like government efficiency, this might take a while.",
        "Fetching workflows at bureaucratic speed!",
        "If this were a political debate, we'd be waiting for the first honest answer...",
        "Loading processes with the urgency of a congressional holiday!",
        "This is slower than campaign finance reform!",
        "Fetching workflows at political change speed... very slow!",
        "Our servers are working as hard as politicians during election season!",
        "This delay is sponsored by the Slow Internet Communications Committee."
    ];

    // ==== 5. دوال مساعدة ====
    function toggleElement(id, show) {
        const el = document.getElementById(id);
        if (show) el.classList.remove('hidden');
        else el.classList.add('hidden');
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'error' ? 'fa-exclamation-circle' :
                              type === 'success' ? 'fa-check-circle' :
                              type === 'warning' ? 'fa-exclamation-triangle' :
                              'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    function showConfirm(title, message) {
        return new Promise(resolve => {
            modalTitle.textContent = title;
            modalBody.textContent = message;
            confirmModal.classList.add('show');

            const cleanUp = () => {
                confirmBtn.removeEventListener('click', onConfirm);
                cancelBtn.removeEventListener('click', onCancel);
            };
            const onConfirm = () => {
                cleanUp();
                confirmModal.classList.remove('show');
                resolve(true);
            };
            const onCancel = () => {
                cleanUp();
                confirmModal.classList.remove('show');
                resolve(false);
            };

            confirmBtn.addEventListener('click', onConfirm);
            cancelBtn.addEventListener('click', onCancel);
        });
    }

    let satiricalTimeout;
    function showSatiricalMessage() {
        clearTimeout(satiricalTimeout);
        satiricalTimeout = setTimeout(() => {
            const idx = Math.floor(Math.random() * satiricalMessages.length);
            satiricalMessage.textContent = satiricalMessages[idx];
            satiricalMessage.style.display = 'block';
        }, 10000);
    }
    function hideSatiricalMessage() {
        clearTimeout(satiricalTimeout);
        satiricalMessage.style.display = 'none';
    }

    // ==== 6. حدث النقر على زر Fetch ====
    fetchBtn.addEventListener('click', async function() {
        const owner = ownerInput.value.trim();
        const repo = repoInput.value.trim();
        const token = tokenInput.value.trim();

        if (!owner || !repo || !token) {
            showToast('Please fill all fields', 'error');
            return;
        }

        // حفظ المدخلات
        localStorage.setItem('owner', owner);
        localStorage.setItem('repo', repo);
        localStorage.setItem('token', token);
        localStorage.setItem('status', statusSelect.value);

        // إعداد UI
        fetchBtn.disabled = true;
        toggleElement('successContainer', false);
        toggleElement('resultsContainer', false);
        toggleElement('FailedContainer', false);
        toggleElement('loadingIndicator', true);
        toggleElement('resultsList', false);
        fetchProgressBar.style.width = '0%';

        showSatiricalMessage();

        try {
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 5;
                fetchProgressBar.style.width = `${progress}%`;
                if (progress >= 100) clearInterval(progressInterval);
            }, 200);

            const runs = await fetchWorkflowRuns(owner, repo, token);

            clearInterval(progressInterval);
            fetchProgressBar.style.width = '100%';
            hideSatiricalMessage();

            if (runs.length === 0) {
                toggleElement('resultsContainer', true);
                showToast('No workflow runs found for this repository', 'info');
                Failedtitle.textContent = 'Nothing found';
                Failedtext.textContent = 'No workflow runs found for this repository';
                toggleElement('successContainer', false);
                toggleElement('resultsContainer', false);
                toggleElement('loadingIndicator', false);
                toggleElement('resultsList', false);
                toggleElement('FailedContainer', true);
            } else {
                displayRuns(runs);
                toggleElement('resultsList', true);
            }
        } catch (error) {
            console.error('Error:', error);
            showToast(`Failed to fetch workflow runs: ${error.message}`, 'error');
            Failedtitle.textContent = 'Failed to fetch workflow runs';
            Failedtext.textContent = error.message;
            toggleElement('FailedContainer', true);
            hideSatiricalMessage();
        } finally {
            toggleElement('loadingIndicator', false);
            fetchBtn.disabled = false;
            // Enable and show the refresh button
            hasFetched = true;
            refreshBtn.style.display = 'inline-block';
        }
    });

    // ==== 7. حدث النقر على زر Refresh ====
    refreshBtn.addEventListener('click', function() {
        if (hasFetched && !fetchBtn.disabled) {
            // إعادة تشغيل نفس عملية الفيتش
            fetchBtn.click();
        }
    });

    // ==== 8. حدث Delete All كما كان سابقاً ====
    deleteAllBtn.addEventListener('click', async function() {
        const owner = ownerInput.value.trim();
        const repo = repoInput.value.trim();
        const token = tokenInput.value.trim();

        if (!owner || !repo || !token) {
            showToast('Please fill all fields', 'error');
            return;
        }

        localStorage.setItem('owner', owner);
        localStorage.setItem('repo', repo);
        localStorage.setItem('token', token);
        localStorage.setItem('status', statusSelect.value);

        const runElements = runsContainer.querySelectorAll('.workflow-run');
        const runIds = Array.from(runElements).map(el => +el.dataset.id);
        if (runIds.length === 0) {
            showToast('No runs to delete', 'error');
            return;
        }

        const confirmed = await showConfirm(
            'Confirm Deletion',
            `Are you sure you want to delete ${runIds.length} workflow runs?`
        );
        if (!confirmed) return;

        deleteAllBtn.disabled = true;
        const originalText = deleteAllBtn.innerHTML;
        deleteAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        toggleElement('progressContainer', true);
        progressBar.style.width = '0%';

        let deletedCount = 0;
        for (const id of runIds) {
            try {
                await deleteWorkflowRun(owner, repo, token, id);
                const el = document.querySelector(`.workflow-run[data-id="${id}"]`);
                if (el) el.remove();
                deletedCount++;
                progressBar.style.width = `${Math.round(deletedCount / runIds.length * 100)}%`;
            } catch (err) {
                console.error(`Error deleting run ${id}:`, err);
                showToast(`Failed to delete run #${id}: ${err.message}`, 'error');
            }
        }

        runCount.textContent = '0';
        toggleElement('resultsList', false);
        toggleElement('successContainer', true);
        showToast(`Successfully deleted ${deletedCount} workflow runs`, 'success');

        deleteAllBtn.disabled = false;
        deleteAllBtn.innerHTML = originalText;
        toggleElement('resultsContainer', false);
        toggleElement('FailedContainer', false);
        toggleElement('loadingIndicator', false);
        toggleElement('resultsList', false);
        toggleElement('progressContainer', false);
        toggleElement('successContainer', true);
    });

    // ==== بقية الدوال الخاصة بـ GitHub API وعرض النتائج كما كانت ====
    async function fetchWorkflowRuns(owner, repo, token) {
        const perPage = 100;
        let page = 1;
        let allRuns = [];
        while (true) {
            const res = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=${perPage}&page=${page}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                }
            );
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || `HTTP ${res.status}`);
            }
            const data = await res.json();
            if (!data.workflow_runs.length) break;
            allRuns = allRuns.concat(data.workflow_runs);
            page++;
        }
        return allRuns;
    }

    async function deleteWorkflowRun(owner, repo, token, runId) {
        const res = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            }
        );
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || `HTTP ${res.status}`);
        }
        return true;
    }

    function displayRuns(runs) {
        runsContainer.innerHTML = '';
        runCount.textContent = runs.length;
        const filter = statusSelect.value;
        const filtered = filter === 'all' ?
            runs :
            runs.filter(r => r.conclusion === filter);

        if (!filtered.length) {
            runsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-filter"></i>
                    <h3>No runs match your filter</h3>
                    <p>Try changing the status filter</p>
                </div>`;
            deleteAllBtn.disabled = true;
            return;
        }

        deleteAllBtn.disabled = false;
        filtered.forEach(run => {
            const el = document.createElement('div');
            el.className = 'workflow-run';
            el.dataset.id = run.id;
            const date = new Date(run.created_at);
            const fmt = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            let cls = 'status-pending',
                txt = run.status;
            if (run.conclusion === 'success') {
                cls = 'status-success';
                txt = 'Success';
            } else if (run.conclusion === 'failure') {
                cls = 'status-failure';
                txt = 'Failed';
            } else if (run.conclusion === 'cancelled') {
                cls = 'status-cancelled';
                txt = 'Cancelled';
            }
            el.innerHTML = `
                <div class="run-info">
                    <div class="run-id">#${run.id} - ${run.name}</div>
                    <div>Branch: ${run.head_branch} | Date: ${fmt}</div>
                    <div class="run-status ${cls}">${txt}</div>
                </div>
                <div class="run-actions">
                    <button class="btn btn-danger delete-btn" data-id="${run.id}">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </div>`;
            runsContainer.appendChild(el);

            el.querySelector('.delete-btn').addEventListener('click', async function() {
                const id = this.dataset.id;
                const confirmed = await showConfirm(
                    'Confirm Deletion',
                    `Delete workflow run #${id}?`
                );
                if (!confirmed) return;
                try {
                    await deleteWorkflowRun(
                        ownerInput.value.trim(),
                        repoInput.value.trim(),
                        tokenInput.value.trim(),
                        id
                    );
                    el.remove();
                    runCount.textContent = parseInt(runCount.textContent) - 1;
                    showToast(`Run #${id} deleted`, 'success');
                    if (runCount.textContent === '0') {
                        toggleElement('resultsList', false);
                        toggleElement('resultsContainer', true);
                    }
                } catch (err) {
                    showToast(`Failed to delete #${id}: ${err.message}`, 'error');
                }
            });
        });
    }
});