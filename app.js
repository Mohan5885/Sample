const items = [
    {
        sku: "LAP001",
        name: "Dell Latitude Laptop",
        category: "Electronics",
        unit: "Piece",
        price: 45000,
        quantity: 17,
        reorder: 5,
        supplier: "Dell Technologies",
        description: "Business laptop",
        active: true
    },
    {
        sku: "MOU002",
        name: "Wireless Mouse",
        category: "Electronics",
        unit: "Piece",
        price: 750,
        quantity: 3,
        reorder: 10,
        supplier: "Logitech",
        description: "Wireless optical mouse",
        active: true
    },
    {
        sku: "CHR003",
        name: "Office Chair",
        category: "Furniture",
        unit: "Piece",
        price: 5500,
        quantity: 12,
        reorder: 4,
        supplier: "Office Furnishings",
        description: "Ergonomic office chair",
        active: true
    },
    {
        sku: "PAP004",
        name: "A4 Paper Bundle",
        category: "Office Supplies",
        unit: "Pack",
        price: 320,
        quantity: 0,
        reorder: 8,
        supplier: "Paper World",
        description: "A4 printing paper",
        active: true
    }
];

const itemsTable = document.getElementById("itemsTable");
const itemForm = document.getElementById("itemForm");
const formPanel = document.getElementById("formPanel");
const formMessage = document.getElementById("formMessage");
const categoryFilter = document.getElementById("categoryFilter");
const profileBtn = document.getElementById("profileBtn");
const profileDropdown = document.getElementById("profileDropdown");
const customCategoryInput = document.getElementById("customCategory");
const customUnitInput = document.getElementById("customUnit");

const viewPanel = document.getElementById("viewPanel");
const closeViewBtn = document.getElementById("closeViewBtn");
const viewCloseBtn = document.getElementById("viewCloseBtn");
const viewEditBtn = document.getElementById("viewEditBtn");

const confirmPanel = document.getElementById("confirmPanel");
const closeConfirmBtn = document.getElementById("closeConfirmBtn");
const cancelConfirmBtn = document.getElementById("cancelConfirmBtn");
const confirmActionBtn = document.getElementById("confirmActionBtn");

let editingSku = null;
let currentViewingItem = null;
let currentConfirmItem = null;
let lastFocusedElement = null;

function formatMoney(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);
}

function getStockStatus(item) {
    if (item.quantity === 0) return "Out of Stock";
    if (item.quantity <= item.reorder) return "Low Stock";
    return "In Stock";
}

function getStockClass(status) {
    if (status === "Out of Stock") return "out-stock";
    if (status === "Low Stock") return "low-stock";
    return "in-stock";
}

function getItemIcon(category) {
    const icons = {
        Electronics: "💻",
        "Office Supplies": "📦",
        Furniture: "🪑"
    };

    return icons[category] || "📋";
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
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

function updateDashboard() {
    const activeItems = items.filter(item => item.active);

    const totalUnits = activeItems.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    const lowStock = activeItems.filter(
        item => item.quantity <= item.reorder
    ).length;

    const inventoryValue = activeItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    document.getElementById("totalItems").textContent =
        activeItems.length;

    document.getElementById("totalUnits").textContent =
        totalUnits.toLocaleString("en-IN");

    document.getElementById("lowStock").textContent =
        String(lowStock).padStart(2, "0");

    document.getElementById("inventoryValue").textContent =
        inventoryValue >= 100000
            ? "₹" + (inventoryValue / 100000).toFixed(2) + "L"
            : formatMoney(inventoryValue);
}

function updateCategoryFilter() {
    const selectedCategory = categoryFilter.value;
    const categories = new Set([
        "Electronics",
        "Office Supplies",
        "Furniture",
        "Others",
        ...items.map(item => item.category)
    ]);

    categoryFilter.replaceChildren(new Option("All Categories", ""));

    [...categories]
        .sort((first, second) => first.localeCompare(second))
        .forEach(category => {
            categoryFilter.add(new Option(category, category));
        });

    categoryFilter.value = categories.has(selectedCategory)
        ? selectedCategory
        : "";
}

function syncCustomOption(selectId, input, value, isCustom = false) {
    const select = document.getElementById(selectId);

    if (value !== undefined) {
        const isPredefined = Array.from(select.options).some(option =>
            option.value === value && value !== "Others"
        );

        if (isCustom || !isPredefined) {
            select.value = "Others";
            input.value = value;
        } else {
            select.value = value;
            input.value = "";
        }
    }

    const showCustomInput = select.value === "Others";
    input.hidden = !showCustomInput;
    input.required = showCustomInput;

    if (!showCustomInput) {
        input.value = "";
    }
}

function renderItems() {
    updateCategoryFilter();

    const search = document.getElementById("searchInput")
        .value.trim().toLowerCase();

    const category = categoryFilter.value;
    const status = document.getElementById("statusFilter").value;

    const filteredItems = items.filter(item => {
        const matchesSearch =
            item.name.toLowerCase().includes(search) ||
            item.sku.toLowerCase().includes(search) ||
            item.category.toLowerCase().includes(search);

        const matchesCategory =
            !category || item.category === category;

        const matchesStatus =
            !status || getStockStatus(item) === status;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    itemsTable.innerHTML = "";

    if (filteredItems.length === 0) {
        itemsTable.innerHTML = `
            <tr>
                <td colspan="7" class="empty-table-state">
                    <div class="empty-state-box">
                        <div class="empty-state-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="11" cy="11" r="8"/>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                <line x1="8" y1="11" x2="14" y2="11"/>
                            </svg>
                        </div>
                        <h3>No items found</h3>
                        <p>No inventory items match your current filter criteria. Try adjusting your search term, clearing status filters, or adding a new item.</p>
                    </div>
                </td>
            </tr>
        `;
    }

    filteredItems.forEach(item => {
        const stockStatus = getStockStatus(item);
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <div class="item-cell">
                    <div class="item-icon" aria-hidden="true">
                        ${getItemIcon(item.category)}
                    </div>
                    <div class="item-meta">
                        <span class="item-name"></span>
                        <span class="item-sku"></span>
                    </div>
                </div>
            </td>
            <td>
                <span class="category-pill item-category"></span>
            </td>
            <td class="price-cell">
                <span class="price-val">${formatMoney(item.price)}</span>
            </td>
            <td class="quantity-cell">
                <span class="qty-val">${item.quantity}</span>
                <span class="qty-unit">${escapeHTML(item.unit)}</span>
            </td>
            <td>
                <span class="stock-badge ${getStockClass(stockStatus)}">
                    <span class="badge-dot"></span>
                    <span>${stockStatus}</span>
                </span>
            </td>
            <td>
                <span class="${item.active ? "active-badge" : "inactive-badge"}">
                    <span class="badge-dot"></span>
                    <span>${item.active ? "Active" : "Inactive"}</span>
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="icon-btn"
                        title="View item details"
                        data-action="view"
                        data-sku="${escapeHTML(item.sku)}"
                        aria-label="View ${escapeHTML(item.name)}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="1.8" stroke-linecap="round"
                            stroke-linejoin="round" aria-hidden="true">
                            <path d="M2.5 12s3.4-7 9.5-7 9.5 7 9.5 7-3.4 7-9.5 7-9.5-7-9.5-7Z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>

                    <button class="icon-btn"
                        title="Edit item"
                        data-action="edit"
                        data-sku="${escapeHTML(item.sku)}"
                        aria-label="Edit ${escapeHTML(item.name)}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="1.8" stroke-linecap="round"
                            stroke-linejoin="round" aria-hidden="true">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                    </button>

                    <button class="icon-btn ${item.active ? "toggle-btn-active" : "toggle-btn-inactive"}"
                        title="${item.active ? "Deactivate" : "Activate"} item"
                        data-action="toggle"
                        data-sku="${escapeHTML(item.sku)}"
                        aria-label="${item.active ? "Deactivate" : "Activate"} ${escapeHTML(item.name)}">
                        ${item.active
                            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`
                            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`}
                    </button>
                </div>
            </td>
        `;

        row.querySelector(".item-name").textContent = item.name;
        row.querySelector(".item-sku").textContent = item.sku;
        row.querySelector(".item-category").textContent = item.category;

        itemsTable.appendChild(row);
    });

    document.getElementById("resultCount").textContent =
        `Showing ${filteredItems.length} of ${items.length} items`;

    updateDashboard();
}

function openForm(item = null) {
    lastFocusedElement = document.activeElement;
    editingSku = item ? item.sku : null;

    itemForm.reset();
    formMessage.textContent = "";
    syncCustomOption("category", customCategoryInput);
    syncCustomOption("unit", customUnitInput);

    document.getElementById("formTitle").textContent =
        item ? "Edit Item" : "Add New Item";

    document.getElementById("saveBtn").textContent =
        item ? "Update Item" : "Save Item";

    document.getElementById("sku").readOnly = Boolean(item);

    if (item) {
        document.getElementById("sku").value = item.sku;
        document.getElementById("name").value = item.name;
        syncCustomOption(
            "category",
            customCategoryInput,
            item.category,
            item.categoryIsCustom
        );
        syncCustomOption(
            "unit",
            customUnitInput,
            item.unit,
            item.unitIsCustom
        );
        document.getElementById("price").value = item.price;
        document.getElementById("quantity").value = item.quantity;
        document.getElementById("reorder").value = item.reorder;
        document.getElementById("supplier").value = item.supplier;
        document.getElementById("description").value = item.description;
    } else {
        document.getElementById("reorder").value = 5;
    }

    formPanel.hidden = false;
    formPanel.classList.add("visible");
    document.body.classList.add("modal-open");
    document.getElementById("sku").focus();
}

function closeForm() {
    formPanel.classList.remove("visible");
    formPanel.hidden = true;
    document.body.classList.remove("modal-open");
    itemForm.reset();
    formMessage.textContent = "";
    editingSku = null;
    syncCustomOption("category", customCategoryInput);
    syncCustomOption("unit", customUnitInput);

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
        lastFocusedElement.focus();
    }
}

function openViewModal(item) {
    if (!item || !viewPanel) return;
    currentViewingItem = item;
    lastFocusedElement = document.activeElement;

    const stockStatus = getStockStatus(item);
    const stockClass = getStockClass(stockStatus);
    const icon = getItemIcon(item.category);

    const badgeIcon = document.getElementById("viewItemBadgeIcon");
    if (badgeIcon) badgeIcon.textContent = icon;

    const codeSub = document.getElementById("viewItemCodeSub");
    if (codeSub) codeSub.textContent = `SKU: ${item.sku}`;

    const itemName = document.getElementById("viewItemName");
    if (itemName) itemName.textContent = item.name;

    const itemSku = document.getElementById("viewItemSku");
    if (itemSku) itemSku.textContent = item.sku;

    const itemCat = document.getElementById("viewItemCategory");
    if (itemCat) itemCat.textContent = `${icon} ${item.category}`;

    const itemPrice = document.getElementById("viewItemPrice");
    if (itemPrice) itemPrice.textContent = formatMoney(item.price);

    const itemQty = document.getElementById("viewItemQuantity");
    if (itemQty) itemQty.textContent = `${item.quantity} ${item.unit}`;

    const itemVal = document.getElementById("viewItemTotalValue");
    if (itemVal) itemVal.textContent = formatMoney(item.price * item.quantity);

    const itemReorder = document.getElementById("viewItemReorder");
    if (itemReorder) itemReorder.textContent = `${item.reorder} ${item.unit}`;

    const reorderStatus = document.getElementById("viewReorderStatus");
    if (reorderStatus) {
        if (item.quantity === 0) {
            reorderStatus.textContent = "Out of stock";
            reorderStatus.style.color = "var(--danger)";
            reorderStatus.style.fontWeight = "600";
        } else if (item.quantity <= item.reorder) {
            reorderStatus.textContent = "Low stock alert";
            reorderStatus.style.color = "var(--warning)";
            reorderStatus.style.fontWeight = "600";
        } else {
            reorderStatus.textContent = "Stock level optimal";
            reorderStatus.style.color = "var(--text-subtle)";
            reorderStatus.style.fontWeight = "normal";
        }
    }

    const itemUnit = document.getElementById("viewItemUnit");
    if (itemUnit) itemUnit.textContent = item.unit;

    const itemSupplier = document.getElementById("viewItemSupplier");
    if (itemSupplier) itemSupplier.textContent = item.supplier || "Not specified";

    const itemDesc = document.getElementById("viewItemDescription");
    if (itemDesc) itemDesc.textContent = item.description || "No description provided.";

    const stockBadge = document.getElementById("viewStockStatusBadge");
    if (stockBadge) {
        stockBadge.innerHTML = `
            <span class="stock-badge ${stockClass}">
                <span class="badge-dot"></span>
                <span>${stockStatus}</span>
            </span>
        `;
    }

    const activeBadge = document.getElementById("viewActiveStatusBadge");
    if (activeBadge) {
        activeBadge.innerHTML = `
            <span class="${item.active ? "active-badge" : "inactive-badge"}">
                <span class="badge-dot"></span>
                <span>${item.active ? "Active" : "Inactive"}</span>
            </span>
        `;
    }

    viewPanel.hidden = false;
    viewPanel.classList.add("visible");
    document.body.classList.add("modal-open");
    if (closeViewBtn) closeViewBtn.focus();
}

function closeViewModal() {
    if (!viewPanel) return;
    viewPanel.classList.remove("visible");
    viewPanel.hidden = true;
    document.body.classList.remove("modal-open");
    currentViewingItem = null;

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
        lastFocusedElement.focus();
    }
}

function openConfirmModal(item) {
    if (!item || !confirmPanel) return;
    currentConfirmItem = item;
    lastFocusedElement = document.activeElement;

    const isDeactivating = item.active;
    const iconBadge = document.getElementById("confirmIconBadge");
    const confirmTitle = document.getElementById("confirmTitle");
    const confirmMessageText = document.getElementById("confirmMessageText");
    const confirmPreviewName = document.getElementById("confirmPreviewName");
    const confirmPreviewSku = document.getElementById("confirmPreviewSku");
    const confirmItemCategoryIcon = document.getElementById("confirmItemCategoryIcon");
    const confirmPreviewBadge = document.getElementById("confirmPreviewBadge");

    if (confirmTitle) {
        confirmTitle.textContent = isDeactivating ? "Deactivate Item" : "Activate Item";
    }

    if (confirmPreviewName) {
        confirmPreviewName.textContent = item.name;
    }

    if (confirmPreviewSku) {
        confirmPreviewSku.textContent = `SKU: ${item.sku}`;
    }

    if (confirmItemCategoryIcon) {
        confirmItemCategoryIcon.textContent = getItemIcon(item.category);
    }

    if (confirmMessageText) {
        confirmMessageText.innerHTML = isDeactivating
            ? `Are you sure you want to deactivate <strong>${escapeHTML(item.name)}</strong>? Deactivated items will be excluded from inventory valuations and active stock reports.`
            : `Are you sure you want to activate <strong>${escapeHTML(item.name)}</strong>? Activated items will be restored to live inventory valuations and operational reports.`;
    }

    if (confirmPreviewBadge) {
        confirmPreviewBadge.innerHTML = `
            <span class="${item.active ? "active-badge" : "inactive-badge"}">
                <span class="badge-dot"></span>
                <span>${item.active ? "Active" : "Inactive"}</span>
            </span>
        `;
    }

    if (iconBadge) {
        if (isDeactivating) {
            iconBadge.className = "confirm-icon-badge danger-badge";
            iconBadge.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                </svg>
            `;
        } else {
            iconBadge.className = "confirm-icon-badge success-badge";
            iconBadge.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            `;
        }
    }

    if (confirmActionBtn) {
        if (isDeactivating) {
            confirmActionBtn.className = "btn-danger";
            confirmActionBtn.textContent = "Deactivate Item";
        } else {
            confirmActionBtn.className = "primary-btn";
            confirmActionBtn.textContent = "Activate Item";
        }
    }

    confirmPanel.hidden = false;
    confirmPanel.classList.add("visible");
    document.body.classList.add("modal-open");
    if (confirmActionBtn) confirmActionBtn.focus();
}

function closeConfirmModal() {
    if (!confirmPanel) return;
    confirmPanel.classList.remove("visible");
    confirmPanel.hidden = true;
    document.body.classList.remove("modal-open");
    currentConfirmItem = null;

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
        lastFocusedElement.focus();
    }
}

document.getElementById("showFormBtn").addEventListener("click", () => {
    openForm();
});

document.getElementById("closeFormBtn").addEventListener(
    "click",
    closeForm
);

document.getElementById("cancelBtn").addEventListener(
    "click",
    closeForm
);

if (closeViewBtn) {
    closeViewBtn.addEventListener("click", closeViewModal);
}

if (viewCloseBtn) {
    viewCloseBtn.addEventListener("click", closeViewModal);
}

if (viewEditBtn) {
    viewEditBtn.addEventListener("click", () => {
        const itemToEdit = currentViewingItem;
        closeViewModal();
        if (itemToEdit) {
            openForm(itemToEdit);
        }
    });
}

document.getElementById("category").addEventListener("change", () => {
    syncCustomOption("category", customCategoryInput);
});

document.getElementById("unit").addEventListener("change", () => {
    syncCustomOption("unit", customUnitInput);
});

formPanel.addEventListener("click", event => {
    if (event.target === formPanel) {
        closeForm();
    }
});

if (viewPanel) {
    viewPanel.addEventListener("click", event => {
        if (event.target === viewPanel) {
            closeViewModal();
        }
    });
}

if (closeConfirmBtn) {
    closeConfirmBtn.addEventListener("click", closeConfirmModal);
}

if (cancelConfirmBtn) {
    cancelConfirmBtn.addEventListener("click", closeConfirmModal);
}

if (confirmActionBtn) {
    confirmActionBtn.addEventListener("click", () => {
        if (!currentConfirmItem) return;
        currentConfirmItem.active = !currentConfirmItem.active;
        closeConfirmModal();
        renderItems();
    });
}

if (confirmPanel) {
    confirmPanel.addEventListener("click", event => {
        if (event.target === confirmPanel) {
            closeConfirmModal();
        }
    });
}

profileBtn.addEventListener("click", () => {
    profileDropdown.hidden = !profileDropdown.hidden;
    profileBtn.setAttribute("aria-expanded", String(!profileDropdown.hidden));
});

document.addEventListener("click", event => {
    if (
        !profileDropdown.hidden &&
        !event.target.closest(".profile-menu-container")
    ) {
        profileDropdown.hidden = true;
        profileBtn.setAttribute("aria-expanded", "false");
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        if (!formPanel.hidden) {
            closeForm();
        }

        if (viewPanel && !viewPanel.hidden) {
            closeViewModal();
        }

        if (confirmPanel && !confirmPanel.hidden) {
            closeConfirmModal();
        }

        profileDropdown.hidden = true;
        profileBtn.setAttribute("aria-expanded", "false");
    }
});

document.getElementById("searchInput").addEventListener(
    "input",
    renderItems
);

document.getElementById("categoryFilter").addEventListener(
    "change",
    renderItems
);

document.getElementById("statusFilter").addEventListener(
    "change",
    renderItems
);

itemsTable.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const item = items.find(
        entry => entry.sku === button.dataset.sku
    );

    if (!item) return;

    const action = button.dataset.action;

    if (action === "view") {
        openViewModal(item);
    }

    if (action === "edit") {
        openForm(item);
    }

    if (action === "toggle") {
        openConfirmModal(item);
    }
});

itemForm.addEventListener("submit", event => {
    event.preventDefault();
    formMessage.textContent = "";

    const wasEditing = Boolean(editingSku);

    const sku = document.getElementById("sku").value.trim();
    const name = document.getElementById("name").value.trim();
    const categoryIsCustom =
        document.getElementById("category").value === "Others";
    const unitIsCustom =
        document.getElementById("unit").value === "Others";
    const category = categoryIsCustom
        ? customCategoryInput.value.trim()
        : document.getElementById("category").value;
    const unit = unitIsCustom
        ? customUnitInput.value.trim()
        : document.getElementById("unit").value;
    const price = Number(document.getElementById("price").value);
    const quantity = Number(document.getElementById("quantity").value);
    const reorder = Number(document.getElementById("reorder").value);
    const supplier = document.getElementById("supplier").value.trim();
    const description = document.getElementById("description").value.trim();

    if (!sku || !name || !category || !unit) {
        formMessage.textContent =
            "Please complete all required fields.";
        return;
    }

    if (
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isInteger(quantity) ||
        quantity < 0 ||
        !Number.isInteger(reorder) ||
        reorder < 0
    ) {
        formMessage.textContent =
            "Enter a valid price and non-negative whole-number quantities.";
        return;
    }

    const duplicate = items.some(item =>
        item.sku.toLowerCase() === sku.toLowerCase() &&
        item.sku !== editingSku
    );

    if (duplicate) {
        formMessage.textContent =
            "This SKU already exists. Enter a unique item code.";
        return;
    }

    const itemData = {
        sku,
        name,
        category,
        categoryIsCustom,
        unit,
        unitIsCustom,
        price,
        quantity,
        reorder,
        supplier,
        description
    };

    if (wasEditing) {
        const existingItem = items.find(
            item => item.sku === editingSku
        );

        if (existingItem) {
            Object.assign(existingItem, itemData);
        }
    } else {
        items.unshift({
            ...itemData,
            active: true
        });
    }

    closeForm();

    document.getElementById("searchInput").value = "";
    categoryFilter.value = "";
    document.getElementById("statusFilter").value = "";

    renderItems();

    alert(
        wasEditing
            ? "Item updated successfully!"
            : "Item added successfully!"
    );
});

document.getElementById("exportBtn").addEventListener("click", () => {
    const headers = [
        "SKU",
        "Name",
        "Category",
        "Unit",
        "Price",
        "Quantity",
        "Reorder Level",
        "Stock Status",
        "Stock Value",
        "Supplier",
        "Description",
        "Active"
    ];

    const csvCell = value =>
        '"' + String(value ?? "").replace(/"/g, '""') + '"';

    const rows = items.map(item => [
        item.sku,
        item.name,
        item.category,
        item.unit,
        item.price,
        item.quantity,
        item.reorder,
        getStockStatus(item),
        (item.price * item.quantity).toFixed(2),
        item.supplier,
        item.description,
        item.active ? "Yes" : "No"
    ]);

    const csv = [headers, ...rows]
        .map(row => row.map(csvCell).join(","))
        .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `stockpilot-inventory-report-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
});

renderItems();
