class ItemTugas {
  constructor({ id, title, priority = 'sedang', dueDate = '', completed = false }) {
    this.id = id;
    this.title = title;
    this.priority = priority;
    this.dueDate = dueDate;
    this.completed = completed;
  }
}

class AplikasiDashboard {
  constructor() {
    this.storageKey = 'personal-dashboard-tasks';
    this.tasks = [];
    this.editingId = null;
    this.elements = {
      form: document.querySelector('#formulir-tugas'), title: document.querySelector('#judul-tugas-input'),
      priority: document.querySelector('#prioritas-tugas'), due: document.querySelector('#tenggat-tugas'),
      list: document.querySelector('#daftar-tugas'), filter: document.querySelector('#filter-status-tugas'),
      message: document.querySelector('#pesan-tugas'), formTitle: document.querySelector('#judul-formulir'),
      submit: document.querySelector('#tombol-kirim'), cancel: document.querySelector('#tombol-batal')
    };
  }

  async init() {
    this.bindEvents();
    this.showDate();
    const savedTasks = localStorage.getItem(this.storageKey);
    if (savedTasks) {
      this.tasks = JSON.parse(savedTasks).map((task) => new ItemTugas(task));
    } else {
      this.tasks = await this.loadInitialTasks();
      this.saveTasks();
    }
    this.render();
  }

  bindEvents() {
    this.elements.form.addEventListener('submit', (event) => { event.preventDefault(); this.saveTask(); });
    this.elements.filter.addEventListener('change', () => this.render());
    this.elements.cancel.addEventListener('click', () => this.resetForm());
    this.elements.list.addEventListener('click', (event) => this.handleAction(event));
    this.elements.list.addEventListener('change', (event) => {
      if (event.target.matches('.cek-tugas')) this.toggleTask(event.target.dataset.id);
    });
  }

  async loadInitialTasks() {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5');
      if (!response.ok) throw new Error('Gagal mengambil data');
      const data = await response.json();
      return data.map(({ id, title, completed }) => new ItemTugas({ id: `api-${id}`, title, completed, priority: 'sedang' }));
    } catch (error) {
      return [new ItemTugas({ id: `local-${Date.now()}`, title: 'Buat tugas pertama kamu', priority: 'tinggi' })];
    }
  }

  saveTask() {
    const { title, priority, due } = this.elements;
    if (this.editingId) {
      this.tasks = this.tasks.map((task) => task.id === this.editingId
        ? new ItemTugas({ ...task, title: title.value.trim(), priority: priority.value, dueDate: due.value }) : task);
    } else {
      this.tasks = [new ItemTugas({ id: `task-${Date.now()}`, title: title.value.trim(), priority: priority.value, dueDate: due.value }), ...this.tasks];
    }
    this.saveTasks(); this.resetForm(); this.render();
  }

  handleAction(event) {
    const button = event.target.closest('button');
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === 'edit') this.editTask(id);
    if (action === 'delete') this.deleteTask(id);
  }

  toggleTask(id) {
      this.tasks = this.tasks.map((task) => task.id === id ? new ItemTugas({ ...task, completed: !task.completed }) : task);
    this.saveTasks(); this.render();
  }

  editTask(id) {
    const task = this.tasks.find((item) => item.id === id); if (!task) return;
    this.editingId = id; this.elements.title.value = task.title; this.elements.priority.value = task.priority; this.elements.due.value = task.dueDate;
    this.elements.formTitle.textContent = 'Edit Tugas'; this.elements.submit.textContent = 'Simpan Perubahan'; this.elements.cancel.classList.remove('tersembunyi'); this.elements.title.focus();
  }

  deleteTask(id) { this.tasks = this.tasks.filter((task) => task.id !== id); this.saveTasks(); this.render(); }
  saveTasks() { localStorage.setItem(this.storageKey, JSON.stringify(this.tasks)); }
  resetForm() { this.editingId = null; this.elements.form.reset(); this.elements.priority.value = 'sedang'; this.elements.formTitle.textContent = 'Tambah Tugas'; this.elements.submit.textContent = 'Tambah Tugas'; this.elements.cancel.classList.add('tersembunyi'); }
  showDate() { document.querySelector('#hari-ini').textContent = new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date()); }

  render() {
    const filter = this.elements.filter.value;
    const visibleTasks = this.tasks.filter(({ completed }) => filter === 'semua' || (filter === 'selesai' ? completed : !completed));
    document.querySelector('#jumlah-total').textContent = this.tasks.length;
    document.querySelector('#jumlah-belum').textContent = this.tasks.filter(({ completed }) => !completed).length;
    document.querySelector('#jumlah-selesai').textContent = this.tasks.filter(({ completed }) => completed).length;
    this.elements.message.textContent = `${visibleTasks.length} tugas ditampilkan`;
    this.elements.list.innerHTML = visibleTasks.length ? visibleTasks.map((task) => this.taskTemplate(task)).join('') : '<div class="kosong">Belum ada tugas pada filter ini.</div>';
  }

  taskTemplate({ id, title, priority, dueDate, completed }) {
    const dueText = dueDate ? `Tenggat: ${new Intl.DateTimeFormat('id-ID').format(new Date(`${dueDate}T00:00:00`))}` : 'Tidak ada tenggat';
    return `<article class="item-tugas ${completed ? 'selesai' : ''}"><input class="cek-tugas" type="checkbox" data-id="${id}" ${completed ? 'checked' : ''} aria-label="Tandai tugas selesai"><div><div class="judul-tugas">${title}<span class="lencana ${priority}">${priority}</span></div><div class="meta-tugas">${dueText}</div></div><div class="aksi-tugas"><button class="tombol-ikon" data-action="edit" data-id="${id}" aria-label="Edit tugas">Edit</button><button class="tombol-ikon hapus" data-action="delete" data-id="${id}" aria-label="Hapus tugas">Hapus</button></div></article>`;
  }
}

const app = new AplikasiDashboard();
app.init();
