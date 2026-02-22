
  let isAdmin = false, allStudents = [], allGallery = [], gFilter = 'all';
  const ptitles = { dashboard: 'Dashboard', notices: 'Notice Board', events: 'Events', gallery: 'Gallery', students: 'Students' };

  // NAVIGATION & UI
  function navigate(p) {
    document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.ni').forEach(x => x.classList.remove('active'));
    document.getElementById('page-' + p).classList.add('active');
    document.querySelector(`[data-page="${p}"]`).classList.add('active');
    document.getElementById('pageTitle').textContent = ptitles[p];
  }
  
  document.querySelectorAll('.ni').forEach(i => {
    i.addEventListener('click', () => {
      navigate(i.dataset.page);
      if (window.innerWidth < 992) closeSidebar();
    });
  });

  window.setAdmin = function(v) {
    isAdmin = v;
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = v ? (el.tagName === 'BUTTON' ? 'inline-flex' : 'table-cell') : 'none';
    });
    document.getElementById('loginBtn').style.display = v ? 'none' : 'inline-flex';
    document.getElementById('logoutBtn').style.display = v ? 'inline-flex' : 'none';
    const u = document.getElementById('sidebarUser');
    u.innerHTML = v
      ? `<div class="sav">A</div><div><div style="color:#fff;font-size:.78rem;font-weight:500">Administrator</div><div style="font-size:.67rem;color:var(--gold)">Full Access</div></div>`
      : `<div class="sav">G</div><div><div style="color:#fff;font-size:.78rem;font-weight:500">Guest</div><div style="font-size:.67rem">View Only</div></div>`;
    renderStudents(allStudents);
  };

  // AUTH MODALS
  function openLogin() { document.getElementById('loginOverlay').classList.add('open'); }
  function closeLogin() { document.getElementById('loginOverlay').classList.remove('open'); }
  async function doLogin() {
    const email = document.getElementById('lEmail').value, pwd = document.getElementById('lPwd').value;
    const err = document.getElementById('lErr'); err.style.display = 'none';
    try { await window.fbLogin(email, pwd); closeLogin(); }
    catch (e) { err.textContent = e.message || 'Login failed'; err.style.display = ''; }
  }

  // GENERAL MODALS
  window.openModal = function(id) { document.getElementById(id).classList.add('open'); };
  window.closeModal = function(id) { document.getElementById(id).classList.remove('open'); };
  document.querySelectorAll('.mb').forEach(b => b.addEventListener('click', e => { if (e.target === b) b.classList.remove('open'); }));

  // NOTICES
  window.renderNotices = function(list) {
    document.getElementById('statN').textContent = list.length;
    document.getElementById('dashN').innerHTML = list.slice(0, 4).map(n => `
      <div class="qi"><div class="qdot" style="background:${n.category === 'exam' ? '#e67e22' : n.category === 'finance' ? 'var(--rose)' : n.category === 'meeting' ? 'var(--teal)' : 'var(--gold)'}"></div>
      <div><div class="qit">${n.title}</div><div class="qis">${n.category || 'general'} · ${n.date}</div></div></div>`).join('');
    const grid = document.getElementById('noticeGrid');
    if (!list.length) { grid.innerHTML = '<div style="color:var(--ink-muted)">No notices yet.</div>'; return; }
    grid.innerHTML = list.map(n => `
      <div class="nc ${n.category || 'general'}">
        <span class="ncat ${n.category || 'general'}">${n.category || 'general'}</span>
        <div class="nt">${n.title}</div>
        <div class="nb">${n.body}</div>
        <div class="nd">📅 ${n.date}</div>
        ${isAdmin ? `<button class="btn btn-d btn-sm ndel" onclick="window.deleteNotice('${n.id}')">Delete</button>` : ''}
      </div>`).join('');
  };
  
  async function submitNotice() {
    const title = document.getElementById('nTitle').value.trim(), body = document.getElementById('nBody').value.trim(), date = document.getElementById('nDate').value, category = document.getElementById('nCat').value;
    if (!title || !body || !date) { alert('Fill all required fields.'); return; }
    await window.addNotice({ title, body, date, category });
    closeModal('noticeModal');
    ['nTitle', 'nBody', 'nDate'].forEach(i => document.getElementById(i).value = '');
  }

  // EVENTS
  window.renderEvents = function(list) {
    document.getElementById('statE').textContent = list.length;
    document.getElementById('dashE').innerHTML = list.slice(0, 4).map(ev => `
      <div class="qi"><div class="qdot" style="background:var(--sky)"></div>
      <div><div class="qit">${ev.title}</div><div class="qis">${ev.date}${ev.venue ? ' · ' + ev.venue : ''}</div></div></div>`).join('');
    const c = document.getElementById('eventsList');
    if (!list.length) { c.innerHTML = '<div style="color:var(--ink-muted)">No events scheduled.</div>'; return; }
    c.innerHTML = list.map(ev => {
      const d = ev.date ? new Date(ev.date + 'T00:00:00') : new Date();
      return `<div class="ei">
        <div class="edb"><div class="edd">${d.getDate()}</div><div class="edm">${d.toLocaleString('en', { month: 'short' }).toUpperCase()}</div></div>
        <div class="einfo">
          <div class="etitle">${ev.title}</div>
          <div class="emeta">${ev.time ? `<span>🕐 ${ev.time}</span>` : ''}${ev.venue ? `<span>📍 ${ev.venue}</span>` : ''}</div>
          ${ev.description ? `<div class="edesc">${ev.description}</div>` : ''}
        </div>
        ${isAdmin ? `<button class="btn btn-d btn-sm edel" onclick="window.deleteEvent('${ev.id}')">Delete</button>` : ''}
      </div>`;
    }).join('');
  };

  async function submitEvent() {
    const title = document.getElementById('eTitle').value.trim(), date = document.getElementById('eDate').value;
    const time = document.getElementById('eTime').value.trim(), venue = document.getElementById('eVenue').value.trim();
    const description = document.getElementById('eDesc').value.trim();
    if (!title || !date) { alert('Fill required fields.'); return; }
    await window.addEvent({ title, date, time, venue, description });
    closeModal('eventModal');
    ['eTitle', 'eDate', 'eTime', 'eVenue', 'eDesc'].forEach(i => document.getElementById(i).value = '');
  }

  /* ==============================
     GALLERY & CLOUDINARY UPLOAD
  ============================== */
  document.querySelectorAll('.fc').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.fc').forEach(c => c.classList.remove('active'));
      chip.classList.add('active'); gFilter = chip.dataset.filter; renderGallery(allGallery);
    });
  });

  window.renderGallery = function(list) {
    allGallery = list; document.getElementById('statG').textContent = list.length;
    const filtered = gFilter === 'all' ? list : list.filter(g => g.category === gFilter);
    const g = document.getElementById('galleryGrid');
    if (!filtered.length) { g.innerHTML = '<div style="color:var(--ink-muted)">No photos in this category.</div>'; return; }
    g.innerHTML = filtered.map(img => `
      <div class="gi" onclick="openLb('${img.url}')">
        <img src="${img.url}" alt="${img.title}" loading="lazy">
        <div class="gov"><div class="got">${img.title}</div><div class="goc">${img.category}</div></div>
        ${isAdmin ? `<button class="gdel" onclick="event.stopPropagation();window.deleteGalleryItem('${img.id}')">✕</button>` : ''}
      </div>`).join('');
  };

  function previewG(e) {
    const f = e.target.files[0]; if (!f) return;
    const p = document.getElementById('gPreview'); p.src = URL.createObjectURL(f); p.style.display = '';
  }

  // CLOUDINARY API FETCH
  async function uploadToCloudinary(file) {
    const cloudName = "dvprvaaam"; 
    const uploadPreset = "school_gallery_VAver2"; 
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const response = await fetch(url, { method: "POST", body: formData });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || "Cloudinary upload failed");
    }
    const data = await response.json();
    return data.secure_url; 
  }

  // COMBINED SUBMIT FUNCTION
  async function submitGallery() {
    const title = document.getElementById('gTitle') ? document.getElementById('gTitle').value.trim() : 'Gallery Image';
    const category = document.getElementById('gCat') ? document.getElementById('gCat').value : 'general';
    const fileInput = document.getElementById('gFile');
    const file = fileInput ? fileInput.files[0] : null;

    if (!file) { alert('Please select an image file to upload.'); return; }

    // Grab the modal upload button to show progress
    const uploadBtn = document.querySelector("#galleryModal .btn-p");
    if(uploadBtn) { uploadBtn.disabled = true; uploadBtn.textContent = 'Uploading...'; }

    try {
      // 1. Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(file);
      
      // 2. Save text and URL to Firestore
      await window.addGalleryItem({
        title: title,
        category: category,
        url: imageUrl
      });

      // 3. Cleanup
      closeModal('galleryModal');
      if(document.getElementById('gTitle')) document.getElementById('gTitle').value = '';
      if(fileInput) fileInput.value = '';
      if(document.getElementById('gPreview')) document.getElementById('gPreview').style.display = 'none';
      
    } catch (error) {
      alert("Error uploading image: " + error.message);
    } finally {
      if(uploadBtn) { uploadBtn.disabled = false; uploadBtn.textContent = 'Upload'; }
    }
  }

  // STUDENTS
  window.renderStudents = function(list) {
    allStudents = list;
    document.getElementById('statS').textContent = list.filter(s => s.status === 'active').length;
    filterStudents();
  };
  
  function filterStudents() {
    const q = (document.getElementById('sSearch')?.value || '').toLowerCase();
    const f = q ? allStudents.filter(s => s.name?.toLowerCase().includes(q) || s.grade?.toLowerCase().includes(q) || s.roll?.includes(q)) : allStudents;
    const tbody = document.getElementById('studentsTable');
    if (!f.length) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--ink-muted);padding:20px">No students found.</td></tr>`; return; }
    tbody.innerHTML = f.map(s => `<tr>
      <td style="font-family:'DM Mono';font-size:.8rem">${s.roll}</td>
      <td style="font-weight:500">${s.name}</td>
      <td><span style="background:var(--cream-dk);padding:3px 8px;border-radius:5px;font-size:.78rem">${s.grade}</span></td>
      <td style="color:var(--ink-muted)">${s.email || '—'}</td>
      <td style="color:var(--ink-muted)">${s.phone || '—'}</td>
      <td><span class="badge ${s.status === 'active' ? 'ba' : 'bi'}">${s.status}</span></td>
      ${isAdmin ? `<td><button class="btn btn-d btn-sm" onclick="window.deleteStudent('${s.id}')">Remove</button></td>` : '<td style="display:none"></td>'}
    </tr>`).join('');
  }

  async function submitStudent() {
    const name = document.getElementById('sName').value.trim(), roll = document.getElementById('sRoll').value.trim(), grade = document.getElementById('sGrade').value.trim();
    const status = document.getElementById('sStatus').value, email = document.getElementById('sEmail').value.trim(), phone = document.getElementById('sPhone').value.trim();
    if (!name || !roll || !grade) { alert('Fill required fields.'); return; }
    await window.addStudent({ name, roll, grade, status, email, phone });
    closeModal('studentModal');
    ['sName', 'sRoll', 'sGrade', 'sEmail', 'sPhone'].forEach(i => document.getElementById(i).value = '');
  }

  // COURSES
  window.renderCoursesAdmin = function(list) {
    const grid = document.getElementById('coursesAdminGrid');
    if (!grid) return;
    if (!list.length) {
      grid.innerHTML = `<div class="empty-state">📘 No courses added yet</div>`; return;
    }
    grid.innerHTML = list.map(c => `
      <div class="course-card">
        <div class="course-head">
          <h3>${c.title}</h3>
          <span class="course-grade">Grade ${c.grade}</span>
        </div>
        <p class="course-desc">${c.description}</p>
        <div class="course-meta">
          <div><strong>Subjects</strong><p>${c.subjects}</p></div>
          <div><strong>Syllabus</strong><p>${c.syllabus}</p></div>
        </div>
        ${isAdmin ? `<div class="course-actions"><button class="btn btn-d btn-sm" onclick="window.deleteCourse('${c.id}')">Delete</button></div>` : ``}
      </div>`).join('');
  };

  async function submitCourse() {
    const title = document.getElementById('cTitle').value.trim();
    const grade = document.getElementById('cGrade').value.trim();
    const description = document.getElementById('cDesc').value.trim();
    const subjects = document.getElementById('cSubjects').value.trim();
    const syllabus = document.getElementById('cSyllabus').value.trim();

    if (!title || !grade || !description || !subjects || !syllabus) { alert("Please fill all fields."); return; }
    await window.addCourse({ title, grade, description, subjects, syllabus });
    closeModal('courseModal');
    ['cTitle', 'cGrade', 'cDesc', 'cSubjects', 'cSyllabus'].forEach(i => document.getElementById(i).value = '');
  }

  // LIGHTBOX & SIDEBAR
  function openLb(url) { document.getElementById('lbImg').src = url; document.getElementById('lightbox').classList.add('open'); }
  function closeLb() { document.getElementById('lightbox').classList.remove('open'); }

  function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('active');
  }

  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
  }
