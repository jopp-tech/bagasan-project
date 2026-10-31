
// ==========================================
// BAGASAN - RICE BUSINESS MANAGEMENT SYSTEM
// ==========================================


// 1. DATABASE SETUP
// localStorage saves records inside the browser.

const STORAGE_KEY = "bagasanData";

function createEmptyData() {
    return {
        products: [],
        sales: [],
        restocks: [],
        expenses: []
    };
}

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return createEmptyData();
        }

        const data = JSON.parse(saved);

        if (
            !data ||
            !Array.isArray(data.products) ||
            !Array.isArray(data.sales) ||
            !Array.isArray(data.restocks) ||
            !Array.isArray(data.expenses)
        ) {
            throw new Error("Invalid saved data");
        }

        return data;

    } catch (error) {
        alert("Your saved data could not be read. Please check your backup.");
        return createEmptyData();
    }
}

let data = loadData();

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        alert("Unable to save data. Please export a backup and check your browser storage.");
    }
}


// 2. HELPER FUNCTIONS

function generateId() {
    return Date.now().toString(36) +
        Math.random().toString(36).slice(2);
}

function formatMoney(amount) {
    return Number(amount).toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP"
    });
}

function formatNumber(number) {
    return Number(number).toLocaleString("en-PH", {
        maximumFractionDigits: 2
    });
}

function getToday() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getProduct(id) {
    return data.products.find(product => product.id === id);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function emptyRow(columns, message) {
    return `
        <tr>
            <td colspan="${columns}" class="empty">
                ${message}
            </td>
        </tr>
    `;
}


// 3. NAVIGATION

const navigationButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");
const pageTitle = document.getElementById("page-title");

navigationButtons.forEach(button => {

    button.addEventListener("click", function () {

        const page = this.dataset.page;

        pages.forEach(section => {
            section.classList.remove("active");
        });

        navigationButtons.forEach(nav => {
            nav.classList.remove("active");
        });

        document.getElementById(page).classList.add("active");

        this.classList.add("active");

        pageTitle.textContent = this.textContent;

    });

});


// 4. INVENTORY MANAGEMENT

document.getElementById("inventory-form")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const name = document.getElementById("rice-name").value.trim();
        const sackSize = Number(document.getElementById("sack-size").value);
        const stock = Number(document.getElementById("initial-stock").value);
        const cost = Number(document.getElementById("cost-price").value);
        const price = Number(document.getElementById("selling-price").value);

        if (!name || !sackSize || stock < 0 ||
            !Number.isFinite(cost) || cost < 0 ||
            !Number.isFinite(price) || price < 0) {

            alert("Please enter valid product information.");
            return;
        }

        const duplicate = data.products.some(product =>
            product.name.toLowerCase() === name.toLowerCase()
        );

        if (duplicate) {
            alert("This rice product already exists.");
            return;
        }

        const product = {
            id: generateId(),
            name: name,
            sackSize: sackSize,
            stock: stock,
            cost: cost,
            price: price
        };

        data.products.push(product);

        saveData();
        renderAll();

        this.reset();

        document.getElementById("sack-size").value = 50;

        alert("Rice product added successfully!");

    });


function renderInventory() {

    const table = document.getElementById("inventory-table");

    if (data.products.length === 0) {
        table.innerHTML = emptyRow(6, "No rice products added yet.");
        return;
    }

    table.innerHTML = data.products.map(product => `

        <tr>
            <td>${escapeHTML(product.name)}</td>

            <td>${formatNumber(product.stock)} kg</td>

            <td>${formatNumber(product.stock / product.sackSize)} sacks</td>

            <td>${formatMoney(product.cost)}</td>

            <td>${formatMoney(product.price)}</td>

            <td>
                <button class="small-btn danger-btn"
                    onclick="deleteProduct('${product.id}')">
                    Delete
                </button>
            </td>
        </tr>

    `).join("");

}

function deleteProduct(id) {

    const product = getProduct(id);

    if (!product) return;

    if (product.stock > 0) {
        alert("You cannot delete a product with remaining stock.");
        return;
    }

    if (!confirm("Delete " + product.name + "?")) return;

    data.products = data.products.filter(item => item.id !== id);

    saveData();
    renderAll();

}


// 5. PRODUCT DROPDOWNS

function updateProductOptions() {

    const saleSelect = document.getElementById("sale-product");
    const restockSelect = document.getElementById("restock-product");

    const options = data.products.map(product => `
        <option value="${product.id}">
            ${escapeHTML(product.name)} (${formatNumber(product.stock)} kg available)
        </option>
    `).join("");

    saleSelect.innerHTML =
        '<option value="">Select rice product</option>' + options;

    restockSelect.innerHTML =
        '<option value="">Select rice product</option>' + options;

}


// 6. SALES MANAGEMENT

document.getElementById("sales-form")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const productId = document.getElementById("sale-product").value;
        const quantity = Number(document.getElementById("sale-quantity").value);
        const paymentType = document.getElementById("payment-type").value;
        const customer = document.getElementById("sale-customer").value.trim();
        const amountPaid = Number(document.getElementById("amount-paid").value);

        const product = getProduct(productId);

        if (!product) {
            alert("Please select a valid rice product.");
            return;
        }

        if (!Number.isFinite(quantity) || quantity <= 0) {
            alert("Please enter a valid quantity.");
            return;
        }

        if (quantity > product.stock) {
            alert("Not enough rice in inventory!");
            return;
        }

        if (!Number.isFinite(amountPaid) || amountPaid < 0) {
            alert("Please enter a valid payment amount.");
            return;
        }

        if (paymentType !== "Cash" && !customer) {
            alert("Please enter the customer's name.");
            return;
        }

        const total = quantity * product.price;

        let paid = 0;

        if (paymentType === "Cash") {
            paid = total;
        } else if (paymentType === "Partial") {
            paid = amountPaid;
        }

        if (paid > total) {
            alert("Payment cannot be greater than the total sale.");
            return;
        }

        if (paymentType === "Partial" && paid >= total) {
            alert("For full payment, select Cash.");
            return;
        }

        const balance = total - paid;

        const sale = {
            id: generateId(),
            date: new Date().toISOString(),
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            price: product.price,
            cost: product.cost,
            total: total,
            paid: paid,
            balance: balance,
            customer: customer || "Walk-in Customer",
            paymentType: paymentType
        };

        product.stock -= quantity;

        data.sales.push(sale);

        saveData();
        renderAll();

        this.reset();

        document.getElementById("amount-paid").value = 0;

        alert("Sale recorded successfully!");

    });


function renderSales() {

    const table = document.getElementById("sales-table");

    if (data.sales.length === 0) {
        table.innerHTML = emptyRow(7, "No sales recorded yet.");
        return;
    }

    table.innerHTML = [...data.sales].reverse().map(sale => `

        <tr>
            <td>${new Date(sale.date).toLocaleString()}</td>

            <td>${escapeHTML(sale.customer)}</td>

            <td>${escapeHTML(sale.productName)}</td>

            <td>${formatNumber(sale.quantity)} kg</td>

            <td>${formatMoney(sale.total)}</td>

            <td>${formatMoney(sale.paid)}</td>

            <td>${formatMoney(sale.balance)}</td>
        </tr>

    `).join("");

}


// 7. RESTOCKING MANAGEMENT

document.getElementById("restock-form")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const productId = document.getElementById("restock-product").value;
        const supplier = document.getElementById("supplier-name").value.trim();
        const quantity = Number(document.getElementById("restock-quantity").value);
        const cost = Number(document.getElementById("restock-cost").value);

        const product = getProduct(productId);

        if (!product || !supplier ||
            !Number.isFinite(quantity) || quantity <= 0 ||
            !Number.isFinite(cost) || cost < 0) {

            alert("Please enter valid restocking information.");
            return;
        }

        const restock = {
            id: generateId(),
            date: new Date().toISOString(),
            productName: product.name,
            supplier: supplier,
            quantity: quantity,
            cost: cost,
            total: quantity * cost
        };

        product.stock += quantity;
        product.cost = cost;

        data.restocks.push(restock);

        saveData();
        renderAll();

        this.reset();

        alert("Restocking recorded successfully!");

    });


function renderRestocks() {

    const table = document.getElementById("restock-table");

    if (data.restocks.length === 0) {
        table.innerHTML = emptyRow(5, "No restocking records yet.");
        return;
    }

    table.innerHTML = [...data.restocks].reverse().map(item => `

        <tr>
            <td>${new Date(item.date).toLocaleString()}</td>

            <td>${escapeHTML(item.productName)}</td>

            <td>${escapeHTML(item.supplier)}</td>

            <td>${formatNumber(item.quantity)} kg</td>

            <td>${formatMoney(item.total)}</td>
        </tr>

    `).join("");

}


// 8. EXPENSE MANAGEMENT

document.getElementById("expense-form")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const description = document.getElementById("expense-description").value.trim();
        const amount = Number(document.getElementById("expense-amount").value);

        if (!description || !Number.isFinite(amount) || amount <= 0) {
            alert("Please enter valid expense information.");
            return;
        }

        const expense = {
            id: generateId(),
            date: new Date().toISOString(),
            description: description,
            amount: amount
        };

        data.expenses.push(expense);

        saveData();
        renderAll();

        this.reset();

        alert("Expense recorded successfully!");

    });


function renderExpenses() {

    const table = document.getElementById("expenses-table");

    if (data.expenses.length === 0) {
        table.innerHTML = emptyRow(3, "No expenses recorded yet.");
        return;
    }

    table.innerHTML = [...data.expenses].reverse().map(item => `

        <tr>
            <td>${new Date(item.date).toLocaleString()}</td>

            <td>${escapeHTML(item.description)}</td>

            <td>${formatMoney(item.amount)}</td>
        </tr>

    `).join("");

}


// 9. CUSTOMER DEBTS AND PAYMENTS

function renderDebts() {

    const table = document.getElementById("debts-table");

    const unpaidSales = data.sales.filter(sale => sale.balance > 0);

    if (unpaidSales.length === 0) {
        table.innerHTML = emptyRow(6, "No unpaid customer balances.");
        return;
    }

    table.innerHTML = unpaidSales.map(sale => `

        <tr>
            <td>${escapeHTML(sale.customer)}</td>

            <td>${escapeHTML(sale.productName)}</td>

            <td>${formatMoney(sale.total)}</td>

            <td>${formatMoney(sale.paid)}</td>

            <td>${formatMoney(sale.balance)}</td>

            <td>
                <button class="small-btn"
                    onclick="recordPayment('${sale.id}')">
                    Pay
                </button>
            </td>
        </tr>

    `).join("");

}


function recordPayment(id) {

    const sale = data.sales.find(item => item.id === id);

    if (!sale || sale.balance <= 0) return;

    const answer = prompt(
        "Remaining balance: " + formatMoney(sale.balance) +
        "\nEnter the amount paid:"
    );

    if (answer === null || answer.trim() === "") return;

    const payment = Number(answer);

    if (!Number.isFinite(payment) || payment <= 0) {
        alert("Please enter a valid payment.");
        return;
    }

    if (payment > sale.balance) {
        alert("Payment is greater than the remaining balance.");
        return;
    }

    sale.paid += payment;
    sale.balance -= payment;

    saveData();
    renderAll();

    alert("Customer payment recorded!");

}


// 10. DASHBOARD

function renderDashboard() {

    const totalStock = data.products.reduce(
        (sum, product) => sum + product.stock, 0
    );

    const today = getToday();

    const todaySales = data.sales
        .filter(sale => sale.date.slice(0, 10) === today)
        .reduce((sum, sale) => sum + sale.total, 0);

    const totalExpenses = data.expenses.reduce(
        (sum, expense) => sum + expense.amount, 0
    );

    const totalDebts = data.sales.reduce(
        (sum, sale) => sum + sale.balance, 0
    );

    document.getElementById("total-stock").textContent =
        formatNumber(totalStock) + " kg";

    document.getElementById("today-sales").textContent =
        formatMoney(todaySales);

    document.getElementById("total-expenses").textContent =
        formatMoney(totalExpenses);

    document.getElementById("total-debts").textContent =
        formatMoney(totalDebts);


    // Inventory overview

    const inventoryTable = document.getElementById("dashboard-inventory");

    if (data.products.length === 0) {

        inventoryTable.innerHTML = emptyRow(4, "No inventory available.");

    } else {

        inventoryTable.innerHTML = data.products.map(product => `

            <tr>
                <td>${escapeHTML(product.name)}</td>

                <td>${formatNumber(product.stock)} kg</td>

                <td>${formatNumber(product.stock / product.sackSize)} sacks</td>

                <td>${formatMoney(product.price)}</td>
            </tr>

        `).join("");

    }


    // Recent sales

    const recentTable = document.getElementById("recent-sales");

    if (data.sales.length === 0) {

        recentTable.innerHTML = emptyRow(5, "No sales recorded.");

    } else {

        recentTable.innerHTML = [...data.sales]
            .reverse()
            .slice(0, 5)
            .map(sale => `

                <tr>
                    <td>${new Date(sale.date).toLocaleDateString()}</td>

                    <td>${escapeHTML(sale.productName)}</td>

                    <td>${formatNumber(sale.quantity)} kg</td>

                    <td>${formatMoney(sale.total)}</td>

                    <td>${escapeHTML(sale.paymentType)}</td>
                </tr>

            `).join("");

    }

}


// 11. BACKUP AND RESTORE

document.getElementById("export-btn")
    .addEventListener("click", function() {

        const backup = {
            app: "Bagasan",
            version: 1,
            exportedAt: new Date().toISOString(),
            data: data
        };

        const file = new Blob(
            [JSON.stringify(backup, null, 4)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(file);

        const link = document.createElement("a");

        link.href = url;
        link.download = "Bagasan-Backup-" + getToday() + ".json";

        link.click();

        URL.revokeObjectURL(url);

        alert("Backup downloaded successfully!");

    });


document.getElementById("import-btn")
    .addEventListener("click", function() {

        const fileInput = document.getElementById("import-file");

        const file = fileInput.files[0];

        if (!file) {
            alert("Please select a backup file first.");
            return;
        }

        const reader = new FileReader();

        reader.onload = function(event) {

            try {

                const backup = JSON.parse(event.target.result);

                const restored = backup.data;

                if (
                    backup.app !== "Bagasan" ||
                    backup.version !== 1 ||
                    !restored ||
                    !Array.isArray(restored.products) ||
                    !Array.isArray(restored.sales) ||
                    !Array.isArray(restored.restocks) ||
                    !Array.isArray(restored.expenses)
                ) {
                    throw new Error("Invalid backup file.");
                }

                const confirmRestore = confirm(
                    "Restoring will replace your current Bagasan records. Continue?"
                );

                if (!confirmRestore) return;

                data = restored;

                saveData();
                renderAll();

                alert("Backup restored successfully!");

                fileInput.value = "";

            } catch (error) {

                alert("Invalid or damaged backup file.");

            }

        };

        reader.readAsText(file);

    });


// 12. CLEAR ALL DATA

document.getElementById("clear-btn")
    .addEventListener("click", function() {

        const confirmation = confirm(
            "WARNING: This will delete ALL Bagasan records. Have you downloaded a backup?"
        );

        if (!confirmation) return;

        const secondConfirmation = prompt(
            'Type DELETE to confirm.'
        );

        if (secondConfirmation !== "DELETE") {
            alert("Deletion cancelled.");
            return;
        }

        data = createEmptyData();

        saveData();
        renderAll();

        alert("All Bagasan records have been cleared.");

    });


// 13. UPDATE ALL SECTIONS

function renderAll() {

    renderInventory();
    updateProductOptions();
    renderSales();
    renderRestocks();
    renderExpenses();
    renderDebts();
    renderDashboard();

}


// 14. START THE APPLICATION

renderAll();

// Register Bagasan service worker
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js")
            .then(() => {
                console.log("Bagasan offline support is ready!");
            })
            .catch(error => {
                console.error("Service Worker Error:", error);
            });
    });
}

console.log("Bagasan is running successfully!");
