        document.addEventListener('DOMContentLoaded', function() {
            // DOM elements
            const ownerInput = document.getElementById('owner');
            const repoInput = document.getElementById('repo');
            const tokenInput = document.getElementById('token');
            const statusSelect = document.getElementById('status');
            const fetchBtn = document.getElementById('fetchBtn');
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
            
            // Satirical loading messages
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
            
            // Helper function to toggle visibility
            function toggleElement(id, show) {
                const el = document.getElementById(id);
                if (show) {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            }
            
            // Show toast notification
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
                
                // Auto remove after 5 seconds
                setTimeout(() => {
                    toast.classList.add('hide');
                    setTimeout(() => {
                        toast.remove();
                    }, 300);
                }, 5000);
            }
            
            // Custom confirmation dialog
            function showConfirm(title, message) {
                return new Promise((resolve) => {
                    modalTitle.textContent = title;
                    modalBody.textContent = message;
                    confirmModal.classList.add('show');
                    
                    const handleConfirm = () => {
                        confirmModal.classList.remove('show');
                        resolve(true);
                        cleanUp();
                    };
                    
                    const handleCancel = () => {
                        confirmModal.classList.remove('show');
                        resolve(false);
                        cleanUp();
                    };
                    
                    const cleanUp = () => {
                        confirmBtn.removeEventListener('click', handleConfirm);
                        cancelBtn.removeEventListener('click', handleCancel);
                    };
                    
                    confirmBtn.addEventListener('click', handleConfirm);
                    cancelBtn.addEventListener('click', handleCancel);
                });
            }
            
            // Show satirical message after delay
            let satiricalTimeout;
            
            function showSatiricalMessage() {
                clearTimeout(satiricalTimeout);
                satiricalTimeout = setTimeout(() => {
                    const randomIndex = Math.floor(Math.random() * satiricalMessages.length);
                    satiricalMessage.textContent = satiricalMessages[randomIndex];
                    satiricalMessage.style.display = 'block';
                }, 10000); // Show after 10 seconds of loading
            }
            
            // Hide satirical message
            function hideSatiricalMessage() {
                clearTimeout(satiricalTimeout);
                satiricalMessage.style.display = 'none';
            }
            
            // Fetch workflow runs
            fetchBtn.addEventListener('click', async function() {
                const owner = ownerInput.value.trim();
                const repo = repoInput.value.trim();
                const token = tokenInput.value.trim();
                
                if (!owner || !repo || !token) {
                    showToast('Please fill all fields', 'error');
                    return;
                }
                
                // 🚫 تعطيل الزر لمنع النقر المكرر
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
                        Failedtitle.textContent = 'nothing';
                        Failedtext.textContent = 'No workflow runs found for this repository';
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
                    fetchBtn.disabled = false; // ✅ إعادة تفعيل الزر بعد الانتهاء
                }
            });
            
            // Delete all runs
            deleteAllBtn.addEventListener('click', async function() {
                const owner = ownerInput.value.trim();
                const repo = repoInput.value.trim();
                const token = tokenInput.value.trim();
                
                if (!owner || !repo || !token) {
                    showToast('Please fill all fields', 'error');
                    return;
                }
                
                const runElements = runsContainer.querySelectorAll('.workflow-run');
                const runIds = Array.from(runElements).map(el => parseInt(el.dataset.id));
                
                if (runIds.length === 0) {
                    showToast('No runs to delete', 'error');
                    return;
                }
                
                // Use custom confirmation dialog
                const confirmed = await showConfirm(
                    'Confirm Deletion',
                    `Are you sure you want to delete ${runIds.length} workflow runs? This action cannot be undone.`
                );
                
                if (!confirmed) return;
                
                // Setup UI for deletion
                const originalButtonText = deleteAllBtn.innerHTML;
                deleteAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
                deleteAllBtn.disabled = true;
                toggleElement('progressContainer', true);
                progressBar.style.width = '0%';
                
                let deletedCount = 0;
                
                try {
                    for (const runId of runIds) {
                        try {
                            await deleteWorkflowRun(owner, repo, token, runId);
                            // Remove element from DOM
                            const runElement = document.querySelector(`.workflow-run[data-id="${runId}"]`);
                            if (runElement) {
                                runElement.remove();
                            }
                            deletedCount++;
                            
                            // Update progress bar
                            const progress = Math.round((deletedCount / runIds.length) * 100);
                            progressBar.style.width = `${progress}%`;
                        } catch (error) {
                            console.error(`Error deleting run ${runId}:`, error);
                            showToast(`Failed to delete run #${runId}: ${error.message}`, 'error');
                        }
                    }
                    
                    runCount.textContent = '0';
                    toggleElement('resultsList', false);
                    toggleElement('successContainer', true);
                    
                    showToast(`Successfully deleted ${deletedCount} workflow runs`, 'success');
                } finally {
                    deleteAllBtn.innerHTML = originalButtonText;
                    deleteAllBtn.disabled = false;
                    toggleElement('progressContainer', false);
                }
            });
            
            // Back to search button
            backToSearchBtn.addEventListener('click', function() {
                toggleElement('successContainer', false);
                toggleElement('resultsContainer', true);
            });
            
            // Fetch workflow runs from GitHub API
            async function fetchWorkflowRuns(owner, repo, token) {
                const perPage = 100;
                let page = 1;
                let allRuns = [];
                
                try {
                    while (true) {
                        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=${perPage}&page=${page}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Accept': 'application/vnd.github.v3+json',
                                'X-GitHub-Api-Version': '2022-11-28'
                            }
                        });
                        
                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                        }
                        
                        const data = await response.json();
                        const runs = data.workflow_runs || [];
                        
                        if (runs.length === 0) {
                            break; // No more results
                        }
                        
                        allRuns = allRuns.concat(runs);
                        page++;
                    }
                    
                    return allRuns;
                } catch (error) {
                    console.error('API error:', error);
                    throw new Error('Failed to fetch all workflow runs. Check your credentials and repository details.');
                }
            }
            
            // Delete single workflow run
            async function deleteWorkflowRun(owner, repo, token, runId) {
                try {
                    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'X-GitHub-Api-Version': '2022-11-28'
                        }
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                    }
                    
                    return true;
                } catch (error) {
                    console.error('Delete error:', error);
                    throw new Error('Failed to delete workflow run');
                }
            }
            
            // Display workflow runs
            function displayRuns(runs) {
                if (!runs || runs.length === 0) {
                    toggleElement('resultsContainer', true);
                    toggleElement('resultsList', false);
                    return;
                }
                
                runsContainer.innerHTML = '';
                runCount.textContent = runs.length;
                
                // Filter runs by status if needed
                const statusFilter = statusSelect.value;
                const filteredRuns = statusFilter === 'all' ?
                    runs :
                    runs.filter(run => run.conclusion === statusFilter);
                
                if (filteredRuns.length === 0) {
                    runsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-filter"></i>
                    <h3>No runs match your filter</h3>
                    <p>Try changing the status filter</p>
                </div>
            `;
                    deleteAllBtn.disabled = true;
                    return;
                }
                
                filteredRuns.forEach(run => {
                    const runElement = document.createElement('div');
                    runElement.className = 'workflow-run';
                    runElement.dataset.id = run.id;
                    
                    // Format date
                    const runDate = new Date(run.created_at);
                    const formattedDate = runDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    // Status badge
                    let statusClass = '';
                    let statusText = '';
                    
                    switch (run.conclusion) {
                        case 'success':
                            statusClass = 'status-success';
                            statusText = 'Success';
                            break;
                        case 'failure':
                            statusClass = 'status-failure';
                            statusText = 'Failed';
                            break;
                        case 'cancelled':
                            statusClass = 'status-cancelled';
                            statusText = 'Cancelled';
                            break;
                        default:
                            statusClass = 'status-pending';
                            statusText = run.status.charAt(0).toUpperCase() + run.status.slice(1);
                    }
                    
                    runElement.innerHTML = `
                <div class="run-info">
                    <div class="run-id">#${run.id} - ${run.name}</div>
                    <div>Branch: ${run.head_branch} | Date: ${formattedDate}</div>
                    <div class="run-status ${statusClass}">${statusText}</div>
                </div>
                <div class="run-actions">
                    <button class="btn btn-danger delete-btn" data-id="${run.id}">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </div>
            `;
                    
                    runsContainer.appendChild(runElement);
                    
                    // Add event listener to delete button
                    const deleteBtn = runElement.querySelector('.delete-btn');
                    deleteBtn.addEventListener('click', async function() {
                        const runId = this.getAttribute('data-id');
                        const owner = ownerInput.value.trim();
                        const repo = repoInput.value.trim();
                        const token = tokenInput.value.trim();
                        
                        if (!owner || !repo || !token) {
                            showToast('Please fill all fields', 'error');
                            return;
                        }
                        
                        // Use custom confirmation dialog
                        const confirmed = await showConfirm(
                            'Confirm Deletion',
                            `Are you sure you want to delete workflow run #${runId}?`
                        );
                        
                        if (!confirmed) return;
                        
                        try {
                            await deleteWorkflowRun(owner, repo, token, runId);
                            runElement.remove();
                            runCount.textContent = parseInt(runCount.textContent) - 1;
                            showToast(`Workflow run #${runId} deleted.`, 'success');
                            
                            if (parseInt(runCount.textContent) === 0) {
                                toggleElement('resultsList', false);
                                toggleElement('resultsContainer', true);
                            }
                        } catch (error) {
                            showToast(`Failed to delete run #${runId}: ${error.message}`, 'error');
                        }
                    });
                });
                
                deleteAllBtn.disabled = false;
            }
        });