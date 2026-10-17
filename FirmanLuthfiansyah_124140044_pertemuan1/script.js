const STORAGE_KEY = 'KANTIN_KAMPUS_CART_ITEMS_V1';
const PROMO_CODE = 'HEMAT10';
const DISKON_PERSEN = 10;
const MINIMAL_BELANJA_DISKON = 50000;
const HARGA_MINIMAL = 500;
const NAMA_MINIMAL_CHAR = 3;
const QTY_MINIMAL = 1;

let cart = [];
let promoApplied = false;
let inputName, inputPrice, inputQty, previewSubtotal;

function formatRupiah(number) {
  return 'Rp ' + Number(number || 0).toLocaleString('id-ID');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  
  const bgColors = {
    success: 'success',
    warning: 'warning',
    danger: 'danger',
    info: 'info'
  };
  
  const icons = {
    success: '',
    warning: '',
    danger: '',
    info: ''
  };

  toast.className = `toast ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
  
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function loadCartFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      cart = JSON.parse(stored);
      if (!Array.isArray(cart)) {
        cart = [];
      }
      console.log('✓ Data berhasil dimuat dari localStorage:', cart.length, 'item');
    } else {
      cart = [];
    }
  } catch (e) {
    console.error(' Gagal membaca dari localStorage:', e);
    cart = [];
  }
  renderCartTable();
  recalculateAll();
}

function saveCartToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    console.log('✓ Data berhasil disimpan ke localStorage:', cart.length, 'item');
  } catch (e) {
    console.error(' Gagal menyimpan ke localStorage:', e);
    showToast('Gagal menyimpan data ke penyimpanan!', 'danger');
  }
}

function updateFormSubtotalPreview() {
  const p = parseFloat(inputPrice.value) || 0;
  const q = parseInt(inputQty.value) || 0;
  const sub = p * q;
  
  if (previewSubtotal) {
    previewSubtotal.innerHTML = `<span>Estimasi Subtotal:</span> <strong class="text-emerald-700 font-bold">${formatRupiah(sub)}</strong>`;
  }
}

function validateInputForm() {
  let isValid = true;

  const nameVal = inputName.value.trim();
  const priceVal = parseFloat(inputPrice.value);
  const qtyVal = Number(inputQty.value);

  const nameErr = document.getElementById('nameError');
  const priceErr = document.getElementById('priceError');
  const qtyErr = document.getElementById('qtyError');

  if (!nameVal || nameVal.length < NAMA_MINIMAL_CHAR) {
    nameErr.classList.remove('hidden');
    nameErr.classList.add('show');
    inputName.classList.add('error');
    isValid = false;
  } else {
    nameErr.classList.add('hidden');
    nameErr.classList.remove('show');
    inputName.classList.remove('error');
  }

  if (isNaN(priceVal) || priceVal < HARGA_MINIMAL) {
    priceErr.classList.remove('hidden');
    priceErr.classList.add('show');
    inputPrice.classList.add('error');
    isValid = false;
  } else {
    priceErr.classList.add('hidden');
    priceErr.classList.remove('show');
    inputPrice.classList.remove('error');
  }

  if (isNaN(qtyVal) || !Number.isInteger(qtyVal) || qtyVal < QTY_MINIMAL) {
    qtyErr.classList.remove('hidden');
    qtyErr.classList.add('show');
    inputQty.classList.add('error');
    isValid = false;
  } else {
    qtyErr.classList.add('hidden');
    qtyErr.classList.remove('show');
    inputQty.classList.remove('error');
  }

  return isValid;
}

function handleAddItem(event) {
  if (event) event.preventDefault();

  if (!validateInputForm()) {
    showToast('Mohon periksa dan lengkapi input barang dengan benar!', 'danger');
    return;
  }

  const name = inputName.value.trim();
  const price = Math.round(parseFloat(inputPrice.value));
  const qty = parseInt(inputQty.value);
  const subtotal = price * qty;

  const existingItemIndex = cart.findIndex(item => 
    item.name.toLowerCase() === name.toLowerCase()
  );

  if (existingItemIndex > -1) {
    cart[existingItemIndex].qty += qty;
    cart[existingItemIndex].price = price;
    cart[existingItemIndex].subtotal = cart[existingItemIndex].qty * price;
    showToast(`Jumlah "${name}" diperbarui menjadi ${cart[existingItemIndex].qty}`, 'info');
  } else {
    const newItem = {
      id: 'ITEM_' + Date.now(),
      name: name,
      price: price,
      qty: qty,
      subtotal: subtotal
    };
    cart.push(newItem);
    showToast(`"${name}" berhasil dimasukkan ke keranjang!`, 'success');
  }

  saveCartToStorage();
  resetInputForm();
  renderCartTable();
  recalculateAll();
}

function resetInputForm() {
  inputName.value = '';
  inputPrice.value = '';
  inputQty.value = '1';
  
  document.getElementById('nameError').classList.add('hidden');
  document.getElementById('priceError').classList.add('hidden');
  document.getElementById('qtyError').classList.add('hidden');

  inputName.classList.remove('error');
  inputPrice.classList.remove('error');
  inputQty.classList.remove('error');

  updateFormSubtotalPreview();
  inputName.focus();
}

function renderCartTable() {
  const tbody = document.getElementById('cartTableBody');
  const emptyState = document.getElementById('cartEmptyState');
  const badgeCount = document.getElementById('badgeItemCount');
  const cartSummaryText = document.getElementById('cartSummaryText');
  const btnEmpty = document.getElementById('btnEmptyCart');

  badgeCount.textContent = `${cart.length} Item`;

  if (cart.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    emptyState.classList.add('show');
    cartSummaryText.textContent = 'Total 0 barang (0 unit)';
    btnEmpty.disabled = true;
    return;
  }

  emptyState.classList.add('hidden');
  emptyState.classList.remove('show');
  btnEmpty.disabled = false;

  let totalUnits = 0;
  let html = '';

  cart.forEach((item, index) => {
    totalUnits += item.qty;
    html += `
      <tr>
        <td><span class="item-number">${index + 1}</span></td>
        <td class="col-name">
          ${escapeHtml(item.name)}
          <button type="button" class="btn-remove-inline" onclick="removeItem('${item.id}')" title="Hapus item">×</button>
        </td>
        <td class="col-price">${formatRupiah(item.price)}</td>
        <td class="col-qty">
          <div class="qty-control">
            <button type="button" class="qty-btn" onclick="adjustItemQty('${item.id}', -1)" title="Kurangi Qty">-</button>
            <span class="qty-value">${item.qty}</span>
            <button type="button" class="qty-btn" onclick="adjustItemQty('${item.id}', 1)" title="Tambah Qty">+</button>
          </div>
        </td>
        <td class="col-subtotal">${formatRupiah(item.subtotal)}</td>
      </tr>
    `;
  });

  const subtotal = calculateSubtotal();
  const qualifiesAuto = subtotal >= MINIMAL_BELANJA_DISKON;
  const isDiscountActive = (qualifiesAuto || promoApplied) && subtotal > 0;
  const discountAmount = isDiscountActive ? Math.round(subtotal * (DISKON_PERSEN / 100)) : 0;
  const grandTotal = subtotal - discountAmount;

  html += `
    <tr class="row-separator">
      <td colspan="5" style="border-top: 2px solid var(--slate-200);"></td>
    </tr>
    <tr class="row-total">
      <td colspan="4" style="text-align: right; font-weight: 700; padding-right: 1rem;">SUBTOTAL</td>
      <td class="col-subtotal" style="font-weight: 700;">${formatRupiah(subtotal)}</td>
    </tr>
  `;

  if (isDiscountActive) {
    html += `
      <tr class="row-discount">
        <td colspan="4" style="text-align: right; font-weight: 600; padding-right: 1rem; color: var(--rose-600);">DISKON (${DISKON_PERSEN}%)</td>
        <td class="col-subtotal" style="font-weight: 700; color: var(--rose-600);">- ${formatRupiah(discountAmount)}</td>
      </tr>
    `;
  }

  html += `
    <tr class="row-grand-total">
      <td colspan="4" style="text-align: right; font-weight: 800; padding-right: 1rem; font-size: 1rem; color: var(--emerald-700);">TOTAL AKHIR</td>
      <td class="col-subtotal" style="font-weight: 800; font-size: 1rem; color: var(--emerald-700);">${formatRupiah(grandTotal)}</td>
    </tr>
  `;

  tbody.innerHTML = html;
  cartSummaryText.textContent = `Total ${cart.length} barang (${totalUnits} unit)`;
}

function adjustItemQty(itemId, delta) {
  const index = cart.findIndex(it => it.id === itemId);
  if (index === -1) return;

  const newQty = cart[index].qty + delta;
  
  if (newQty < 1) {
    removeItem(itemId);
    return;
  }

  cart[index].qty = newQty;
  cart[index].subtotal = cart[index].price * newQty;
  
  saveCartToStorage();
  renderCartTable();
  recalculateAll();
}

function removeItem(itemId) {
  const target = cart.find(it => it.id === itemId);
  const name = target ? target.name : 'Barang';

  cart = cart.filter(it => it.id !== itemId);
  
  saveCartToStorage();
  renderCartTable();
  recalculateAll();
  
  showToast(`"${name}" dihapus dari keranjang.`, 'warning');
}

function confirmResetCart() {
  if (cart.length === 0) {
    showToast('Keranjang sudah kosong!', 'info');
    return;
  }
  
  if (confirm('Apakah Anda yakin ingin mengosongkan seluruh isi keranjang dan menghapus data dari LocalStorage?')) {
    cart = [];
    promoApplied = false;
    document.getElementById('promoCode').value = '';
    
    saveCartToStorage();
    renderCartTable();
    recalculateAll();
    
    showToast('Keranjang belanja berhasil dikosongkan!', 'info');
  }
}

function calculateSubtotal() {
  return cart.reduce((acc, item) => acc + (item.subtotal || 0), 0);
}

function applyPromoCode() {
  const codeInput = document.getElementById('promoCode');
  const val = codeInput.value.trim().toUpperCase();

  if (val === PROMO_CODE) {
    promoApplied = true;
    showToast('Kode voucher HEMAT10 berhasil diterapkan! (Diskon 10%)', 'success');
  } else if (val === '') {
    promoApplied = false;
    showToast('Kode voucher dinonaktifkan.', 'info');
  } else {
    promoApplied = false;
    showToast('Kode promo tidak valid! Gunakan kode "HEMAT10"', 'danger');
  }
  
  recalculateAll();
}

function recalculateAll() {
  const subtotal = calculateSubtotal();
  
  const qualifiesAutoDiscount = subtotal >= MINIMAL_BELANJA_DISKON;
  const isDiscountActive = (qualifiesAutoDiscount || promoApplied) && subtotal > 0;

  let discountPercent = isDiscountActive ? (DISKON_PERSEN / 100) : 0;
  let discountAmount = Math.round(subtotal * discountPercent);
  let grandTotal = subtotal - discountAmount;

  const dispTotal = document.getElementById('dispTotalBelanja');
  const dispDiscount = document.getElementById('dispNominalDiskon');
  const dispGrandTotal = document.getElementById('dispTotalAkhir');
  const discountStatusBadge = document.getElementById('discountStatusBadge');
  const discountInfoText = document.getElementById('discountInfoText');

  dispTotal.textContent = formatRupiah(subtotal);
  dispDiscount.textContent = `- ${formatRupiah(discountAmount)}`;
  dispGrandTotal.textContent = formatRupiah(grandTotal);

  if (isDiscountActive) {
    discountStatusBadge.className = 'discount-badge active';
    
    if (qualifiesAutoDiscount) {
      discountStatusBadge.textContent = 'Diskon 10% Aktif (Belanja >= 50rb)';
      discountInfoText.innerHTML = `<span style="color: var(--emerald-700); font-weight: 600;">Selamat! Anda mendapatkan potongan 10% karena belanja &ge; Rp 50.000.</span>`;
    } else {
      discountStatusBadge.textContent = 'Diskon 10% Aktif (Kode Promo)';
      discountInfoText.innerHTML = `<span style="color: var(--emerald-700); font-weight: 600;">Voucher HEMAT10 aktif: diskon 10% berhasil dipotong.</span>`;
    }
  } else {
    discountStatusBadge.className = 'discount-badge';
    discountStatusBadge.textContent = 'Belum Memenuhi';
    
    if (subtotal > 0 && subtotal < MINIMAL_BELANJA_DISKON) {
      const shortage = MINIMAL_BELANJA_DISKON - subtotal;
      discountInfoText.innerHTML = `Tambah belanja <strong style="color: var(--emerald-600); font-family: var(--font-mono);">${formatRupiah(shortage)}</strong> lagi untuk diskon otomatis 10%!`;
    } else {
      discountInfoText.innerHTML = 'Otomatis aktif jika belanja minimal <strong>Rp 50.000</strong>.';
    }
  }

  handleCashPaymentCalculation(grandTotal);
}

function handleCashPaymentCalculation(forcedGrandTotal) {
  const subtotal = calculateSubtotal();
  const qualifiesAuto = subtotal >= MINIMAL_BELANJA_DISKON;
  const isDiscountActive = (qualifiesAuto || promoApplied) && subtotal > 0;
  const discountAmount = isDiscountActive ? Math.round(subtotal * (DISKON_PERSEN / 100)) : 0;
  const grandTotal = typeof forcedGrandTotal === 'number' ? forcedGrandTotal : (subtotal - discountAmount);

  const cashInput = document.getElementById('cashPaidInput');
  const cashVal = parseFloat(cashInput.value);

  const resultBox = document.getElementById('changeResultBox');
  const statusBadge = document.getElementById('changeStatusBadge');
  const label = document.getElementById('changeLabel');
  const dispChange = document.getElementById('dispChangeAmount');
  const note = document.getElementById('changeNote');
  const btnFinish = document.getElementById('btnFinishTransaction');

  if (cart.length === 0) {
    statusBadge.className = 'change-badge';
    statusBadge.textContent = 'Keranjang Kosong';
    dispChange.textContent = 'Rp 0';
    dispChange.className = 'change-amount';
    note.textContent = 'Tambahkan barang terlebih dahulu.';
    resultBox.className = 'change-box';
    btnFinish.disabled = true;
    return;
  }

  if (isNaN(cashVal) || cashVal === 0) {
    statusBadge.className = 'change-badge';
    statusBadge.textContent = 'Menunggu Pembayaran';
    label.textContent = 'Kembalian';
    dispChange.textContent = 'Rp 0';
    dispChange.className = 'change-amount';
    note.textContent = 'Masukkan nominal uang yang diserahkan pelanggan.';
    resultBox.className = 'change-box';
    btnFinish.disabled = true;
    return;
  }

  const difference = cashVal - grandTotal;

  if (difference < 0) {
    const shortage = Math.abs(difference);
    statusBadge.className = 'change-badge error';
    statusBadge.textContent = 'Uang Belum Cukup';
    label.textContent = 'Kekurangan Uang';
    dispChange.textContent = `- ${formatRupiah(shortage)}`;
    dispChange.className = 'change-amount';
    note.innerHTML = `<span style="color: var(--rose-600); font-weight: 600;"> Uang bayar kurang ${formatRupiah(shortage)}! Belum dapat dicetak.</span>`;
    resultBox.className = 'change-box error';
    btnFinish.disabled = true;
  } 
  else if (difference === 0) {
    statusBadge.className = 'change-badge success';
    statusBadge.textContent = 'Uang Pas (Lunas)';
    label.textContent = 'Kembalian';
    dispChange.textContent = 'Rp 0';
    dispChange.className = 'change-amount';
    note.innerHTML = `<span style="color: var(--emerald-700); font-weight: 600;"> Pembayaran lunas dengan uang pas. Siap dicetak.</span>`;
    resultBox.className = 'change-box success';
    btnFinish.disabled = false;
  } 
  else {
    statusBadge.className = 'change-badge success';
    statusBadge.textContent = 'Kembalian Tersedia';
    label.textContent = 'Kembalian Pelanggan';
    dispChange.textContent = formatRupiah(difference);
    dispChange.className = 'change-amount';
    note.innerHTML = `<span style="color: var(--emerald-700); font-weight: 600;"> Kembalikan uang <strong>${formatRupiah(difference)}</strong> kepada pembeli.</span>`;
    resultBox.className = 'change-box success';
    btnFinish.disabled = false;
  }
}

function setExactCash() {
  const subtotal = calculateSubtotal();
  const qualifiesAuto = subtotal >= MINIMAL_BELANJA_DISKON;
  const isDiscountActive = (qualifiesAuto || promoApplied) && subtotal > 0;
  const discountAmount = isDiscountActive ? Math.round(subtotal * (DISKON_PERSEN / 100)) : 0;
  const grandTotal = subtotal - discountAmount;

  document.getElementById('cashPaidInput').value = grandTotal;
  handleCashPaymentCalculation(grandTotal);
}

function addQuickCash(amount) {
  const input = document.getElementById('cashPaidInput');
  const current = parseFloat(input.value) || 0;
  input.value = current + amount;
  handleCashPaymentCalculation();
}

function finishTransaction() {
  if (cart.length === 0) {
    showToast('Keranjang masih kosong!', 'warning');
    return;
  }

  const subtotal = calculateSubtotal();
  const qualifiesAuto = subtotal >= MINIMAL_BELANJA_DISKON;
  const isDiscountActive = (qualifiesAuto || promoApplied) && subtotal > 0;
  const discountAmount = isDiscountActive ? Math.round(subtotal * (DISKON_PERSEN / 100)) : 0;
  const grandTotal = subtotal - discountAmount;
  const cashVal = parseFloat(document.getElementById('cashPaidInput').value) || 0;
  const change = cashVal - grandTotal;

  if (change < 0) {
    showToast('Uang pembayaran masih kurang!', 'danger');
    return;
  }

  const now = new Date();
  const options = { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  document.getElementById('receiptDate').textContent = now.toLocaleDateString('id-ID', options);
  
  const itemList = document.getElementById('receiptItemList');
  let itemsHtml = '';
  
  cart.forEach(item => {
    itemsHtml += `
      <div>
        <div class="item-row">
          <span>${escapeHtml(item.name)}</span>
          <span>${formatRupiah(item.subtotal)}</span>
        </div>
        <div class="item-detail">
          ${item.qty} x ${formatRupiah(item.price)}
        </div>
      </div>
    `;
  });
  
  itemList.innerHTML = itemsHtml;

  document.getElementById('rcpSubtotal').textContent = formatRupiah(subtotal);
  document.getElementById('rcpDiscount').textContent = `- ${formatRupiah(discountAmount)}`;
  document.getElementById('rcpGrandTotal').textContent = formatRupiah(grandTotal);
  document.getElementById('rcpCashPaid').textContent = formatRupiah(cashVal);
  document.getElementById('rcpChange').textContent = formatRupiah(change);

  document.getElementById('receiptModal').classList.add('show');
  
  showToast('✓ Pembayaran berhasil! Struk siap dicetak.', 'success');
}

function closeReceiptModal() {
  document.getElementById('receiptModal').classList.remove('show');
}

function startFreshAfterReceipt() {
  closeReceiptModal();
  
  cart = [];
  promoApplied = false;
  document.getElementById('promoCode').value = '';
  document.getElementById('cashPaidInput').value = '';
  
  saveCartToStorage();
  renderCartTable();
  recalculateAll();
  resetInputForm();
  
  showToast('Transaksi selesai! Keranjang siap untuk pelanggan berikutnya.', 'success');
}

function newTransactionPrompt() {
  if (cart.length > 0) {
    if (confirm('Mulai transaksi baru? Keranjang saat ini akan direset dan dibersihkan dari penyimpanan.')) {
      startFreshAfterReceipt();
    }
  } else {
    document.getElementById('cashPaidInput').value = '';
    document.getElementById('promoCode').value = '';
    resetInputForm();
    showToast('Halaman kasir siap digunakan.', 'info');
  }
}

function fillPreset(name, price, qty) {
  inputName.value = name;
  inputPrice.value = price;
  inputQty.value = qty;
  updateFormSubtotalPreview();
  handleAddItem();
}

function updateLiveClock() {
  const now = new Date();
  const optionsDate = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  const dateEl = document.getElementById('currentDate');
  const timeEl = document.getElementById('currentTime');
  
  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString('id-ID', optionsDate);
  }
  
  if (timeEl) {
    timeEl.textContent = now.toLocaleTimeString('id-ID') + ' WIB';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  inputName = document.getElementById('itemName');
  inputPrice = document.getElementById('itemPrice');
  inputQty = document.getElementById('itemQty');
  previewSubtotal = document.getElementById('previewSubtotal');

  loadCartFromStorage();
  
  updateLiveClock();
  setInterval(updateLiveClock, 1000);
  
  if (inputPrice) {
    inputPrice.addEventListener('input', updateFormSubtotalPreview);
  }
  
  if (inputQty) {
    inputQty.addEventListener('input', updateFormSubtotalPreview);
  }
  
  const cashInput = document.getElementById('cashPaidInput');
  if (cashInput) {
    cashInput.addEventListener('input', () => handleCashPaymentCalculation());
  }
  
  console.log('✓ Aplikasi POS Kantin Kampus berhasil diinisialisasi!');
  console.log('✓ LocalStorage aktif dengan key:', STORAGE_KEY);
  console.log('✓ Kode promo valid:', PROMO_CODE);
});

console.log('%c KANTIN KAMPUS POS', 'color: #10b981; font-size: 20px; font-weight: bold;');
console.log('%cSistem Kasir Modern dengan Validasi, Kalkulator & LocalStorage', 'color: #64748b; font-size: 12px;');
console.log('%c© 2026 - Firman Luthfiansyah (124140044)', 'color: #94a3b8; font-size: 10px;');
