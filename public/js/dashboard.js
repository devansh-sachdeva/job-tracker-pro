// Dashboard JavaScript
(function() {
  // Animated Counters
  const counters = document.querySelectorAll('.stat-value');
  const speed = 200;

  const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = parseInt(counter.getAttribute('data-target'));
        animateCounter(counter, target);
        counterObserver.unobserve(counter);
      }
    });
  }, observerOptions);

  counters.forEach(counter => {
    counterObserver.observe(counter);
  });

  function animateCounter(element, target) {
    let current = 0;
    const increment = target / speed;
    const duration = 1000;
    const stepTime = duration / speed;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = target;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current);
      }
    }, stepTime);
  }

  // Search and Filter Functionality
  const searchInput = document.getElementById('searchInput');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const tableBody = document.getElementById('applicationsTable');

  if (!searchInput || !filterButtons.length || !tableBody) return;

  let currentStatus = 'All';
  let currentSearch = '';

  // Search with debounce
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentSearch = e.target.value.toLowerCase().trim();
      filterApplications();
    }, 300);
  });

  // Filter buttons
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentStatus = btn.getAttribute('data-status');
      filterApplications();
    });
  });

  function filterApplications() {
    fetch(`/api/applications?status=${encodeURIComponent(currentStatus === 'All' ? '' : currentStatus)}&search=${encodeURIComponent(currentSearch)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          renderTable(data.applications);
        }
      })
      .catch(err => console.error('Error filtering:', err));
  }

  function renderTable(applications) {
    if (applications.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 3rem;">
            <div style="color: var(--text-secondary);">
              <svg style="width: 48px; height: 48px; margin: 0 auto 1rem; display: block; stroke: var(--text-muted);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              <p>No applications found</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = applications.map((app, index) => `
      <tr class="application-row" data-status="${app.status}" data-company="${app.company_name.toLowerCase()}" style="animation-delay: ${index * 30}ms">
        <td>
          <div class="company-cell">
            <div class="company-avatar">
              ${app.company_name.charAt(0).toUpperCase()}
            </div>
            <span class="company-name">${escapeHtml(app.company_name)}</span>
          </div>
        </td>
        <td class="role-cell">${escapeHtml(app.job_role)}</td>
        <td class="date-cell">
          <span class="date-text">${formatDate(app.date_applied)}</span>
        </td>
        <td>
          <span class="status-badge status-${app.status.toLowerCase().replace(/\s+/g, '-')}">
            ${app.status}
          </span>
        </td>
        <td>
          <div class="action-buttons">
            <a href="/edit/${app.id}" class="btn-icon btn-edit" title="Edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </a>
            <form action="/delete/${app.id}" method="POST" class="delete-form" onsubmit="return confirm('Are you sure you want to delete this application?');">
              <button type="submit" class="btn-icon btn-delete" title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </form>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Toast notification helper
  window.showToast = function(message, type = 'success') {
    const toastContainer = document.getElementById('toast');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${type === 'success'
          ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
          : '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'}
      </svg>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toast-out 0.3s ease-out forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };
})();
