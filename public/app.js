// public/app.js (frontend)

// Load everything on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadSaleProducts();
  loadSales();

  // product form submit
  const productForm = document.getElementById('productForm');
  if (productForm) {
    productForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = document.getElementById('productName').value;
      const price = parseFloat(document.getElementById('productPrice').value);
      const quantity = parseInt(document.getElementById('productQuantity').value);

      try {
        await fetch('/add-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, price, quantity })
        });
        loadProducts(); // refresh table after adding
        productForm.reset();
      } catch (err) {
        console.error('Error adding product:', err);
        alert('Error adding product. See console.');
      }
    });
  }

  // sale form submit (if present)
  const saleForm = document.getElementById("saleForm");
  if (saleForm) {
    saleForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const product_id = Number(document.getElementById('saleProduct').value);
      const quantity = Number(document.getElementById('saleQty').value);
      const tax_rate = Number(document.getElementById('saleTax').value || 0);

      try {
        const res = await fetch('/add-sale', {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id, quantity, tax_rate })
        });

        const data = await res.json();

        if (!res.ok) {
          alert("Error: " + (data.error || JSON.stringify(data)));
          return;
        }

        alert("Sale recorded successfully!");
        loadProducts();
        loadSaleProducts();
        loadSales();
        saleForm.reset();
      } catch (err) {
        console.error('Error recording sale:', err);
        alert('Error recording sale. See console.');
      }
    });
  }

  // attach tab buttons behavior (if any)
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.textContent.trim().toLowerCase();
      showTab(tabName);
    });
  });
});

// ------------------- PRODUCTS -------------------
async function loadProducts() {
  try {
    const res = await fetch('/get-products');
    if (!res.ok) throw new Error('Failed to fetch products');
    const products = await res.json();
    const tableBody = document.getElementById('productTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    products.forEach(p => {
      tableBody.innerHTML += `
        <tr>
          <td>${p.id}</td>
          <td>${escapeHtml(p.name)}</td>
          <td>${Number(p.price).toFixed(2)}</td>
          <td>${p.quantity}</td>
          <td>
            <button onclick="editProduct(${p.id}, '${escapeJs(p.name)}', ${p.price}, ${p.quantity})">Edit</button>
            <button onclick="deleteProduct(${p.id})" style="color:red;">Delete</button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error('Error loading products:', err);
  }
}

async function loadDashboardKPIs() {
  const res = await fetch('/dashboard-kpis');
  const data = await res.json();

  document.getElementById("kpiCards").innerHTML = `
    <div class="kpi-card">Products: <strong>${data.total_products}</strong></div>
    <div class="kpi-card">Sales: <strong>${data.total_sales}</strong></div>
    <div class="kpi-card">Revenue: <strong>SAR ${data.revenue}</strong></div>
    <div class="kpi-card">Expenses: <strong>SAR ${data.expenses}</strong></div>
    <div class="kpi-card">Profit: <strong>SAR ${data.revenue - data.expenses}</strong></div>
  `;
}

let salesChartInstance;

async function loadSalesChart() {
  const res = await fetch('/dashboard-sales-chart');
  const rows = await res.json();

  const labels = rows.map(r => r.month);
  const values = rows.map(r => r.total_sales);

  const ctx = document.getElementById('salesChart').getContext('2d');

  if (salesChartInstance) salesChartInstance.destroy();

  salesChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Monthly Sales',
        data: values,
        borderWidth: 2,
        tension: 0.3
      }]
    }
  });
}

let lowStockChartInstance;

async function loadLowStockChart() {
  const res = await fetch('/dashboard-low-stock');
  const rows = await res.json();

  const labels = rows.map(r => r.name);
  const values = rows.map(r => r.quantity);

  const ctx = document.getElementById('lowStockChart').getContext('2d');

  if (lowStockChartInstance) lowStockChartInstance.destroy();

  lowStockChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Stock Qty',
        data: values,
        borderWidth: 1
      }]
    }
  });
}


function editProduct(id, name, price, quantity) {
  const newName = prompt("Enter new name:", name);
  const newPrice = prompt("Enter new price:", price);
  const newQty = prompt("Enter new quantity:", quantity);

  if (newName === null || newPrice === null || newQty === null) return;

  fetch(`/edit-product/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: newName,
      price: Number(newPrice),
      quantity: Number(newQty)
    })
  })
  .then(res => {
    if (!res.ok) throw new Error('Edit failed');
    loadProducts();
    loadSaleProducts();
  })
  .catch(err => {
    console.error(err);
    alert('Error editing product. See console.');
  });
}

function deleteProduct(id) {
  if (!confirm("Are you sure? This cannot be undone.")) return;

  fetch(`/delete-product/${id}`, { method: "DELETE" })
    .then(res => {
      if (!res.ok) throw new Error('Delete failed');
      loadProducts();
      loadSaleProducts();
    })
    .catch(err => {
      console.error(err);
      alert('Error deleting product. See console.');
    });
}

// ------------------- SALES -------------------
// populate sale dropdown
async function loadSaleProducts() {
  try {
    const res = await fetch('/get-products');
    if (!res.ok) return;
    const products = await res.json();

    const select = document.getElementById('saleProduct');
    if (!select) return;

    select.innerHTML = '<option value="">-- select product --</option>';

    products.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} (Stock: ${p.quantity})`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Error loading sale products:', err);
  }
}

async function loadSales() {
  try {
    const res = await fetch('/get-sales');
    if (!res.ok) return;
    const sales = await res.json();

    const tbody = document.getElementById('salesTableBody');
    if (!tbody) return;
    tbody.innerHTML = "";

    sales.forEach((s, i) => {
      tbody.innerHTML += `
        <tr>
          <td>${i+1}</td>
          <td>${escapeHtml(s.product_name)}</td>
          <td>${s.quantity}</td>
          <td>${Number(s.unit_price).toFixed(2)}</td>
          <td>${Number(s.subtotal).toFixed(2)}</td>
          <td>${Number(s.tax_amount).toFixed(2)}</td>
          <td>${Number(s.total).toFixed(2)}</td>
          <td>${new Date(s.created_at).toLocaleString()}</td>
          <td>
            <button onclick="editSale(${s.id}, ${s.quantity}, ${s.tax_rate})">Edit</button>
            <button onclick="deleteSale(${s.id})" style="color:red;">Delete</button>
            <button onclick="downloadInvoice(${s.id})">Invoice</button>

          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error('Error loading sales:', err);
  }
}

function downloadInvoice(saleId) {
  window.open(`/invoice/${saleId}`, '_blank');
}


function editSale(id, quantity, tax_rate) {
  const newQty = prompt("New quantity:", quantity);
  const newTax = prompt("New tax %:", tax_rate);

  if (newQty === null) return;

  fetch(`/edit-sale/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quantity: Number(newQty),
      tax_rate: Number(newTax || 0)
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) alert(data.error);
    loadSales();
    loadProducts();
    loadSaleProducts();
  })
  .catch(err => {
    console.error(err);
    alert('Error editing sale. See console.');
  });
}

function deleteSale(id) {
  if (!confirm("Delete this sale? Stock will be restored.")) return;

  fetch(`/delete-sale/${id}`, { method: "DELETE" })
    .then(res => {
      if (!res.ok) throw new Error('Delete failed');
      loadSales();
      loadProducts();
      loadSaleProducts();
    })
    .catch(err => {
      console.error(err);
      alert('Error deleting sale. See console.');
    });
}

// ------------------- TABS -------------------
function showTab(tabName) {
  document.querySelectorAll(".tab").forEach(t => t.style.display = "none");
  document.getElementById(tabName).style.display = "block";

  if (tabName === "dashboard") {
    loadDashboardKPIs();
    loadSalesChart();
    loadLowStockChart();
loadTopProductsChart();

  }

if (tabName === "expenses") {
    loadExpenses();
  }

}



let topProductsChart;

async function loadTopProductsChart() {
  try {
    const res = await fetch('/dashboard/top-products');
    const data = await res.json();

    const labels = data.map(item => item.product_name);
    const values = data.map(item => item.total_sold);

    if (topProductsChart) {
      topProductsChart.destroy();
    }

    const ctx = document.getElementById('topProductsChart').getContext('2d');
    topProductsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Units Sold',
          data: values,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });
  } catch (err) {
    console.error("Chart load error:", err);
  }
}

// ------------------- EXPENSES -------------------


async function loadExpenses() {
  const res = await fetch('/get-expenses');
  const expenses = await res.json();

  const tbody = document.getElementById('expensesTableBody');
  if (!tbody) return;

  tbody.innerHTML = "";

  expenses.forEach((e, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(e.category)}</td>
        <td>${Number(e.amount).toFixed(2)}</td>
        <td>${escapeHtml(e.note || '')}</td>
        <td>${new Date(e.created_at).toLocaleDateString()}</td>
        <td>
          <button onclick="editExpense(${e.id}, '${escapeJs(e.category)}', ${e.amount}, '${escapeJs(e.note || '')}')">
            Edit
          </button>
          <button onclick="deleteExpense(${e.id})" style="color:red;">
            Delete
          </button>
        </td>
      </tr>
    `;
  });
}

function editExpense(id, category, amount, note) {
  const newCategory = prompt("Category:", category);
  if (newCategory === null) return;

  const newAmountRaw = prompt("Amount:", amount);
  if (newAmountRaw === null) return;

  const newAmount = Number(newAmountRaw);

  if (isNaN(newAmount) || newAmount <= 0) {
    alert("Please enter a valid numeric amount.");
    return;
  }

  const newNote = prompt("Note:", note);

  fetch(`/edit-expense/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: newCategory.trim(),
      amount: newAmount,
      note: newNote?.trim() || null
    })
  })
  .then(async res => {
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Update failed");
    }
    loadExpenses();
    loadDashboardKPIs();
  })
  .catch(err => {
    console.error(err);
    alert("Failed to edit expense: " + err.message);
  });
}


function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;

  fetch(`/delete-expense/${id}`, { method: 'DELETE' })
    .then(res => {
      if (!res.ok) throw new Error();
      loadExpenses();
      loadDashboardKPIs(); // PROFIT updates
    })
    .catch(() => alert('Failed to delete expense'));
}


document.addEventListener("DOMContentLoaded", () => {
  const expenseForm = document.getElementById('expenseForm');

  if (expenseForm) {
    expenseForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const category = document.getElementById('expenseCategory').value;
      const amount = Number(document.getElementById('expenseAmount').value);
      const note = document.getElementById('expenseNote').value;

      await fetch('/add-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, amount, note })
      });

      expenseForm.reset();
      loadExpenses();
      loadDashboardKPIs(); // PROFIT UPDATES HERE 🔥
    });
  }
});



// ------------------- UTIL -------------------
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"'`]/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#x60;'
  }[s]));
}

function escapeJs(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
