const API = {
  register: '/api/auth/register/',
  token: '/api/auth/token/',
  logout: '/api/auth/logout/',
  profile: '/api/auth/profile/',
  changePassword: '/api/auth/change-password/',
  notes: '/api/notes/',
};

let notesState = {
  page: 1,
  search: '',
  next: null,
  previous: null,
  count: 0,
  pageSize: 10,
};

function setMsg(text, type = 'info') {
  const el = $('#msg');
  el.removeClass('d-none alert-info alert-success alert-danger alert-warning');
  el.addClass('alert-' + type);
  el.text(text);
}

function clearMsg() {
  const el = $('#msg');
  el.addClass('d-none');
  el.text('');
}

function setFlashMsg(text, type = 'info') {
  sessionStorage.setItem('flash_msg', JSON.stringify({ text, type }));
}

function consumeFlashMsg() {
  const raw = sessionStorage.getItem('flash_msg');
  if (!raw) {
    return null;
  }
  sessionStorage.removeItem('flash_msg');
  try {
    return JSON.parse(raw);
  } catch (_e) {
    return { text: String(raw), type: 'info' };
  }
}

function resetRegisterForm() {
  $('#reg_username').val('');
  $('#reg_email').val('');
  $('#reg_password').val('');
}

function errorMessage(e) {
  if (!e) {
    return 'Request failed.';
  }

  const rj = e.responseJSON;
  if (rj) {
    if (typeof rj === 'string') {
      return rj;
    }
    if (rj.detail) {
      return rj.detail;
    }
    if (Array.isArray(rj)) {
      return rj.filter(Boolean).join(', ') || 'Request failed.';
    }
    if (typeof rj === 'object') {
      const keys = Object.keys(rj);
      if (keys.length) {
        const v = rj[keys[0]];
        if (Array.isArray(v)) {
          return v[0] || 'Request failed.';
        }
        if (typeof v === 'string') {
          return v;
        }
        return 'Request failed.';
      }
    }
  }

  if (e.responseText) {
    return String(e.responseText);
  }

  return 'Request failed.';
}

function getTokens() {
  return {
    access: localStorage.getItem('access') || '',
    refresh: localStorage.getItem('refresh') || '',
  };
}

function setTokens(access, refresh) {
  localStorage.setItem('access', access);
  localStorage.setItem('refresh', refresh);
}

function clearTokens() {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
}

function authHeaders() {
  const { access } = getTokens();
  return access ? { Authorization: 'Bearer ' + access } : {};
}

function isAuthenticated() {
  const { access } = getTokens();
  return Boolean(access);
}

function showView(viewId) {
  $('#view_login').addClass('d-none');
  $('#view_register').addClass('d-none');
  $('#view_notes').addClass('d-none');
  $('#view_profile').addClass('d-none');
  $('#view_change_password').addClass('d-none');
  $(viewId).removeClass('d-none');
}

function renderHeader() {
  if (isAuthenticated()) {
    $('#header_nav').removeClass('d-none');
  } else {
    $('#header_nav').addClass('d-none');
  }
}

function navigate(hash) {
  window.location.hash = hash;
}

function setActiveNav(route) {
  $('.auth-nav .nav-link').removeClass('active');

  if (route === 'notes') {
    $('.auth-nav .nav-link-notes').addClass('active');
  } else if (route === 'profile') {
    $('.auth-nav .nav-link-profile').addClass('active');
  } else if (route === 'change-password') {
    $('.auth-nav .nav-link-change-password').addClass('active');
  }
}

function resetNoteForm() {
  $('#note_id').val('');
  $('#note_title').val('');
  $('#note_description').val('');
  $('#note_attachment').val('');
}

function showNoteForm() {
  $('#note_form_section').removeClass('d-none');
  $('#btn_note_add').addClass('d-none');
  $('#notes_list_section').addClass('d-none');
  $('#notes_toolbar').addClass('d-none');
}

function hideNoteForm() {
  $('#note_form_section').addClass('d-none');
  $('#btn_note_add').removeClass('d-none');
  $('#notes_list_section').removeClass('d-none');
  $('#notes_toolbar').removeClass('d-none');
}

async function loadNotes() {
  const q = new URLSearchParams();
  if (notesState.search) {
    q.set('search', notesState.search);
  }
  q.set('page', String(notesState.page || 1));
  const url = API.notes + '?' + q.toString();

  const res = await apiJson('GET', url);
  notesState.next = res.next || null;
  notesState.previous = res.previous || null;
  notesState.count = typeof res.count === 'number' ? res.count : 0;
  if (notesState.page === 1 && Array.isArray(res.results) && res.results.length > 0) {
    notesState.pageSize = res.results.length;
  }
  renderNotes(res.results || []);
  updateNotesPagination();
}

function updateNotesPagination() {
  const canPrev = Boolean(notesState.previous);
  const canNext = Boolean(notesState.next);

  const size = Number(notesState.pageSize) || 10;
  const totalPages = Math.max(1, Math.ceil((Number(notesState.count) || 0) / size));

  $('#btn_notes_prev')
    .prop('disabled', !canPrev)
    .removeClass('btn-primary btn-outline-secondary')
    .addClass(canPrev ? 'btn-primary' : 'btn-outline-secondary');

  $('#btn_notes_next')
    .prop('disabled', !canNext)
    .removeClass('btn-primary btn-outline-secondary')
    .addClass(canNext ? 'btn-primary' : 'btn-outline-secondary');

  $('#notes_page_label').text(
    'Page ' + String(notesState.page || 1) + ' / ' + String(totalPages)
  );
}

function debounce(fn, waitMs) {
  let t = null;
  return function (...args) {
    if (t) {
      clearTimeout(t);
    }
    t = setTimeout(() => fn.apply(this, args), waitMs);
  };
}

function setProfileEditable(editable) {
  $('#profile_email').prop('disabled', !editable);
  $('#profile_full_name').prop('disabled', !editable);
  $('#profile_dob').prop('disabled', !editable);
  $('#profile_address').prop('disabled', !editable);
  $('#profile_gender').prop('disabled', !editable);
  $('#profile_mobile').prop('disabled', !editable);

  if (editable) {
    $('#btn_update_profile').removeClass('d-none');
  } else {
    $('#btn_update_profile').addClass('d-none');
  }
}

async function loadProfile({ silent = false } = {}) {
  const p = await apiJson('GET', API.profile);
  $('#profile_email').val(p.email || '');
  $('#profile_full_name').val(p.full_name || '');
  $('#profile_dob').val(p.date_of_birth || '');
  $('#profile_address').val(p.address || '');
  $('#profile_gender').val(p.gender || '');
  $('#profile_mobile').val(p.mobile_number || '');
  if (!silent) {
    setMsg('Profile loaded.', 'success');
  }
}

function renderRoute() {
  clearMsg();
  const flash = consumeFlashMsg();
  if (flash && flash.text) {
    setMsg(flash.text, flash.type || 'info');
  }
  renderHeader();

  const hash = window.location.hash || '';
  if (!hash || hash === '#') {
    if (isAuthenticated()) {
      navigate('/notes');
    } else {
      navigate('/login');
    }
    return;
  }

  if (hash.startsWith('#/register')) {
    if (isAuthenticated()) {
      navigate('/notes');
      return;
    }
    resetRegisterForm();
    showView('#view_register');
    return;
  }

  if (hash.startsWith('#/login')) {
    if (isAuthenticated()) {
      navigate('/notes');
      return;
    }
    showView('#view_login');
    return;
  }

  if (!isAuthenticated()) {
    setMsg('Please login to access the application.', 'warning');
    navigate('/login');
    return;
  }

  if (hash.startsWith('#/profile')) {
    setActiveNav('profile');
    showView('#view_profile');
    setProfileEditable(false);
    loadProfile({ silent: true }).catch(() => {
      setMsg('Unable to load profile.', 'danger');
    });
    return;
  }

  if (hash.startsWith('#/change-password')) {
    setActiveNav('change-password');
    showView('#view_change_password');
    return;
  }

  setActiveNav('notes');
  showView('#view_notes');
  resetNoteForm();
  hideNoteForm();
  $('#notes_search').val(notesState.search || '');
  loadNotes().catch(() => {
    setMsg('Unable to load notes.', 'danger');
  });
}

async function apiJson(method, url, data) {
  return $.ajax({
    method,
    url,
    contentType: 'application/json',
    data: data ? JSON.stringify(data) : null,
    headers: authHeaders(),
  });
}

async function apiForm(method, url, formData) {
  return $.ajax({
    method,
    url,
    data: formData,
    processData: false,
    contentType: false,
    headers: authHeaders(),
  });
}

function renderNotes(items) {
  const rows = $('#notes_rows');
  rows.empty();
  for (const n of items) {
    const fileName = n.attachment
      ? String(n.attachment).split('?')[0].split('/').pop()
      : '';
    rows.append(`
      <tr>
        <td>${n.title}</td>
        <td>${n.description || ''}</td>
        <td>${(n.modified_at || '').slice(0, 19).replace('T', ' ')}</td>
        <td>${fileName}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-1 btn-note-edit" data-id="${n.id}" data-title="${encodeURIComponent(
      n.title
    )}" data-description="${encodeURIComponent(n.description || '')}">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger btn-note-delete" data-id="${n.id}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `);
  }
}

$(document).on('click', '#btn_register', async function () {
  try {
    await apiJson('POST', API.register, {
      username: $('#reg_username').val(),
      email: $('#reg_email').val(),
      password: $('#reg_password').val(),
    });
    setFlashMsg('Registered successfully. Now login.', 'success');
    navigate('/login');
  } catch (e) {
    setMsg(errorMessage(e), 'danger');
  }
});

$(document).on('click', '#btn_login', async function () {
  try {
    const res = await apiJson('POST', API.token, {
      username: $('#login_username').val(),
      password: $('#login_password').val(),
    });
    setTokens(res.access, res.refresh);
    setMsg('Login successful.', 'success');
    renderHeader();
    navigate('/notes');
  } catch (e) {
    setMsg(errorMessage(e), 'danger');
  }
});

$(document).on('click', '#btn_logout', async function () {
  try {
    const { refresh } = getTokens();
    if (refresh) {
      await apiJson('POST', API.logout, { refresh });
    }
  } catch (e) {
  } finally {
    clearTokens();
    setMsg('Logged out.', 'info');
    renderHeader();
    navigate('/login');
  }
});

$(document).on('click', '#btn_load_profile', async function () {
  try {
    await loadProfile();
  } catch (e) {
    setMsg('Login required to load profile.', 'warning');
  }
});

$(document).on('click', '#btn_profile_edit', function () {
  setProfileEditable(true);
});

$(document).on('click', '#btn_update_profile', async function () {
  try {
    await apiJson('PATCH', API.profile, {
      email: $('#profile_email').val(),
      full_name: $('#profile_full_name').val(),
      date_of_birth: $('#profile_dob').val() || null,
      address: $('#profile_address').val(),
      gender: $('#profile_gender').val(),
      mobile_number: $('#profile_mobile').val(),
    });
    setMsg('Profile updated.', 'success');
    setProfileEditable(false);
  } catch (e) {
    setMsg(errorMessage(e), 'danger');
  }
});

$(document).on('click', '#btn_change_password', async function () {
  try {
    await apiJson('POST', API.changePassword, {
      old_password: $('#old_password').val(),
      new_password: $('#new_password').val(),
    });
    setFlashMsg('Password updated successfully. Please login again.', 'success');
    clearTokens();
    navigate('/login');
  } catch (e) {
    setMsg(errorMessage(e), 'danger');
  }
});

$(document).on('click', '#btn_note_add', function () {
  resetNoteForm();
  showNoteForm();
});

$(document).on('click', '#btn_note_cancel', function () {
  resetNoteForm();
  hideNoteForm();
});

$(document).on('click', '#btn_note_save', async function () {
  try {
    const fd = new FormData();
    fd.append('title', $('#note_title').val());
    fd.append('description', $('#note_description').val());
    const f = $('#note_attachment')[0].files[0];
    if (f) {
      fd.append('attachment', f);
    }

    const id = $('#note_id').val();
    if (id) {
      await apiForm('PATCH', API.notes + id + '/', fd);
      setMsg('Note updated.', 'success');
    } else {
      await apiForm('POST', API.notes, fd);
      setMsg('Note created.', 'success');
    }

    resetNoteForm();
    hideNoteForm();
    await loadNotes();
  } catch (e) {
    setMsg(errorMessage(e), 'danger');
  }
});

$(document).on('input', '#notes_search',
  debounce(async function () {
    notesState.search = String($('#notes_search').val() || '').trim();
    notesState.page = 1;
    try {
      await loadNotes();
    } catch (_e) {
      setMsg('Unable to load notes.', 'danger');
    }
  }, 300)
);

$(document).on('click', '#btn_notes_prev', async function () {
  if (!notesState.previous) {
    return;
  }
  notesState.page = Math.max(1, (notesState.page || 1) - 1);
  try {
    await loadNotes();
  } catch (_e) {
    setMsg('Unable to load notes.', 'danger');
  }
});

$(document).on('click', '#btn_notes_next', async function () {
  if (!notesState.next) {
    return;
  }
  notesState.page = (notesState.page || 1) + 1;
  try {
    await loadNotes();
  } catch (_e) {
    setMsg('Unable to load notes.', 'danger');
  }
});

$(document).on('click', '#notes_rows .btn-note-edit', function () {
  $('#note_id').val($(this).data('id'));
  $('#note_title').val(decodeURIComponent($(this).data('title')));
  $('#note_description').val(decodeURIComponent($(this).data('description')));
  showNoteForm();
  setMsg('Editing note. Click Save to update.', 'info');
});

$(document).on('click', '#notes_rows .btn-note-delete', async function () {
  const id = $(this).data('id');
  try {
    await apiJson('DELETE', API.notes + id + '/');
    setMsg('Deleted.', 'success');
    await loadNotes();
  } catch (e) {
    setMsg(errorMessage(e), 'danger');
  }
});

$(window).on('hashchange', renderRoute);
$(document).ready(function () {
  $(document).on('click', 'a[href^="#/"]', function () {
    clearMsg();
  });

  $(document).ajaxError(function (_event, jqxhr) {
    if (jqxhr && jqxhr.status === 401) {
      clearTokens();
      setMsg('Please login to continue.', 'warning');
      renderHeader();
      navigate('/login');
    }
  });

  renderRoute();
});
