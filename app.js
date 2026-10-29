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
    },
    {
        sku: "MON005",
        name: "24-inch LED Monitor",
        category: "Electronics",
        unit: "Piece",
        price: 12800,
        quantity: 8,
        reorder: 3,
        supplier: "Acer India",
        description: "Full HD LED monitor for office workstations",
        active: true
    },
    {
        sku: "KEY006",
        name: "Mechanical Keyboard",
        category: "Electronics",
        unit: "Piece",
        price: 3200,
        quantity: 4,
        reorder: 6,
        supplier: "Logitech",
        description: "Wired mechanical keyboard for office use",
        active: true
    },
    {
        sku: "DSK007",
        name: "Executive Office Desk",
        category: "Furniture",
        unit: "Piece",
        price: 8900,
        quantity: 6,
        reorder: 2,
        supplier: "Office Furnishings",
        description: "Wood-finish desk with cable management",
        active: true
    },
    {
        sku: "PEN008",
        name: "Blue Ballpoint Pens",
        category: "Office Supplies",
        unit: "Box",
        price: 180,
        quantity: 0,
        reorder: 10,
        supplier: "Classmate",
        description: "Box of blue ballpoint pens for daily office use",
        active: true
    }
];

const itemsTable = document.getElementById("itemsTable");
const itemForm = document.getElementById("itemForm");
const formPanel = document.getElementById("formPanel");
const formMessage = document.getElementById("formMessage");
const categoryFilter = document.getElementById("categoryFilter");
const statusFilter = document.getElementById("statusFilter");
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
const themeToggle = document.getElementById("themeToggle");
const themeToggleLabel = themeToggle.querySelector(".theme-toggle-label");

let editingSku = null;
let hasUnsubmittedFormDraft = false;
let currentViewingItem = null;
let currentConfirmItem = null;
let lastFocusedElement = null;

function setTheme(theme) {
    const isDark = theme === "dark";
    const nextTheme = isDark ? "light" : "dark";
    const label = `Switch to ${nextTheme} theme`;

    document.documentElement.dataset.theme = theme;
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", label);
    themeToggle.title = label;
    themeToggleLabel.textContent = `${nextTheme === "dark" ? "Dark" : "Light"} mode`;
}

let savedTheme = null;

try {
    savedTheme = localStorage.getItem("stockpilot-theme");
} catch (error) {
    console.error("Unable to read the saved theme preference.", error);
}

setTheme(savedTheme === "dark" ? "dark" : "light");

themeToggle.addEventListener("click", () => {
    const nextTheme =
        document.documentElement.dataset.theme === "dark" ? "light" : "dark";

    if (
        document.startViewTransition &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
        document.startViewTransition(() => setTheme(nextTheme));
    } else {
        setTheme(nextTheme);
    }

    try {
        localStorage.setItem("stockpilot-theme", nextTheme);
    } catch (error) {
        console.error("Unable to save the theme preference.", error);
    }
});

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
    const lowStockRate = activeItems.length
        ? Math.round((lowStock / activeItems.length) * 100)
        : 0;
    const inactiveItems = items.length - activeItems.length;

    document.getElementById("totalItems").textContent =
        activeItems.length;

    document.getElementById("activeItemsContext").textContent =
        inactiveItems
            ? `${inactiveItems} inactive item${inactiveItems === 1 ? "" : "s"}`
            : "All catalogue items active";

    document.getElementById("totalUnits").textContent =
        totalUnits.toLocaleString("en-IN");

    document.getElementById("lowStock").textContent =
        lowStock;
    document.getElementById("lowStockContext").textContent =
        `${lowStockRate}% of active items`;

    const lowStockProgress = document.getElementById("lowStockProgress");
    lowStockProgress.setAttribute("aria-valuenow", lowStockRate);
    lowStockProgress.setAttribute(
        "aria-valuetext",
        `${lowStockRate}% of active items at or below reorder level`
    );
    lowStockProgress.firstElementChild.style.width = `${lowStockRate}%`;

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

function updateFilterDropdown(select) {
    const wrapper = select.closest(".filter-select-wrapper");
    const trigger = wrapper.querySelector(".filter-select-trigger");
    const label = wrapper.querySelector(".filter-select-label");
    const menu = wrapper.querySelector(".filter-select-menu");
    const selectedOption = Array.from(select.options).find(
        option => option.value === select.value
    );

    label.textContent = selectedOption
        ? selectedOption.textContent
        : select.options[0].textContent;
    menu.replaceChildren();

    Array.from(select.options).forEach(option => {
        const optionButton = document.createElement("button");
        optionButton.type = "button";
        optionButton.className = "filter-select-option";
        optionButton.setAttribute("role", "option");
        optionButton.setAttribute(
            "aria-selected",
            String(option.value === select.value)
        );
        optionButton.tabIndex = -1;
        const optionLabel = document.createElement("span");
        optionLabel.className = "filter-select-option-label";
        optionLabel.textContent = option.textContent;
        const selectedMark = document.createElement("span");
        selectedMark.className = "filter-select-option-check";
        selectedMark.setAttribute("aria-hidden", "true");
        selectedMark.textContent = "✓";
        optionButton.append(optionLabel, selectedMark);

        optionButton.addEventListener("click", () => {
            select.value = option.value;
            closeFilterDropdown(wrapper);
            trigger.focus();
            select.dispatchEvent(new Event("change", { bubbles: true }));
        });

        menu.append(optionButton);
    });

    trigger.setAttribute("aria-expanded", String(!menu.hidden));
}

function positionFilterDropdown(wrapper) {
    const trigger = wrapper.querySelector(".filter-select-trigger");
    const menu = wrapper.querySelector(".filter-select-menu");
    const triggerRect = trigger.getBoundingClientRect();
    const menuHeight = Math.min(menu.scrollHeight, 240);
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const openAbove = spaceBelow < menuHeight + 8 &&
        triggerRect.top > spaceBelow;
    const left = Math.max(
        8,
        Math.min(triggerRect.left, window.innerWidth - triggerRect.width - 8)
    );
    const top = openAbove
        ? Math.max(8, triggerRect.top - menuHeight - 8)
        : Math.min(
            triggerRect.bottom + 6,
            window.innerHeight - menuHeight - 8
        );

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.style.width = `${triggerRect.width}px`;
}

function closeFilterDropdown(wrapper) {
    const trigger = wrapper.querySelector(".filter-select-trigger");
    const menu = wrapper.querySelector(".filter-select-menu");

    menu.hidden = true;
    wrapper.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
}

function closeFilterDropdowns() {
    document
        .querySelectorAll(".filter-select-wrapper.is-open")
        .forEach(closeFilterDropdown);
}

function initializeFilterDropdown(select) {
    const wrapper = select.closest(".filter-select-wrapper");
    const trigger = wrapper.querySelector(".filter-select-trigger");
    const menu = wrapper.querySelector(".filter-select-menu");

    trigger.addEventListener("click", () => {
        if (!menu.hidden) {
            closeFilterDropdown(wrapper);
            return;
        }

        closeFilterDropdowns();
        updateFilterDropdown(select);
        menu.hidden = false;
        wrapper.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        positionFilterDropdown(wrapper);
    });

    trigger.addEventListener("keydown", event => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

        event.preventDefault();
        if (menu.hidden) trigger.click();

        const selectedOption = menu.querySelector('[aria-selected="true"]');
        (selectedOption || menu.querySelector('[role="option"]'))?.focus();
    });

    menu.addEventListener("keydown", event => {
        const options = Array.from(menu.querySelectorAll('[role="option"]'));
        const currentIndex = options.indexOf(document.activeElement);
        let nextIndex;

        if (event.key === "ArrowDown") {
            nextIndex = (currentIndex + 1) % options.length;
        } else if (event.key === "ArrowUp") {
            nextIndex = (currentIndex - 1 + options.length) % options.length;
        } else if (event.key === "Home") {
            nextIndex = 0;
        } else if (event.key === "End") {
            nextIndex = options.length - 1;
        } else {
            return;
        }

        event.preventDefault();
        options[nextIndex]?.focus();
    });
}

function updateFormCategoryOptions() {
    const categorySelect = document.getElementById("category");
    const selectedCategory = categorySelect.value;
    const defaultCategories = new Set([
        "",
        "Electronics",
        "Office Supplies",
        "Furniture",
        "Others"
    ]);
    const categories = [...new Set(items.map(item => item.category))]
        .filter(category => !defaultCategories.has(category))
        .sort((first, second) => first.localeCompare(second));

    categorySelect
        .querySelectorAll("option[data-existing-category]")
        .forEach(option => {
            if (!categories.includes(option.value)) option.remove();
        });

    const hasCategoryOption = category =>
        Array.from(categorySelect.options).some(
            option => option.value === category
        );

    const othersOption = Array.from(categorySelect.options).find(
        option => option.value === "Others"
    );

    categories.forEach(category => {
        if (hasCategoryOption(category)) return;

        const option = new Option(category, category);
        option.dataset.existingCategory = "true";
        categorySelect.insertBefore(option, othersOption);
    });

    categorySelect.value = selectedCategory;
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
    updateFilterDropdown(categoryFilter);
    updateFilterDropdown(statusFilter);

    const search = document.getElementById("searchInput")
        .value.trim().toLowerCase();

    const category = categoryFilter.value;
    const status = statusFilter.value;

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
                <td colspan="6" class="empty-table-state">
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
                    <div class="item-meta">
                        <span class="item-name"></span>
                        <span class="item-sku"></span>
                    </div>
                </div>
            </td>
            <td>
                <span class="category-pill item-category"><span class="category-pill-label"></span></span>
            </td>
            <td class="price-cell">
                <span class="price-val">${formatMoney(item.price)}</span>
            </td>
            <td class="quantity-cell">
                <span class="qty-val">${item.quantity}</span>
            </td>
            <td>
                <span class="stock-badge ${getStockClass(stockStatus)}">
                    <span class="badge-dot"></span>
                    <span>${stockStatus}</span>
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
                        aria-label="${item.active ? "Deactivate" : "Activate"} ${escapeHTML(item.name)}"
                        aria-pressed="${item.active}">
                        ${item.active
                            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`
                            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`}
                    </button>
                </div>
            </td>
        `;

        row.querySelector(".item-name").textContent = item.name;
        row.querySelector(".item-sku").textContent = item.sku;
        const categoryPill = row.querySelector(".item-category");
        categoryPill.querySelector(".category-pill-label").textContent =
            item.category;
        categoryPill.title = item.category;

        itemsTable.appendChild(row);
    });

    document.getElementById("resultCount").textContent =
        `Showing ${filteredItems.length} of ${items.length} items`;

    updateDashboard();
}

function openForm(item = null) {
    lastFocusedElement = document.activeElement;
    updateFormCategoryOptions();
    const resumeDraft = !item && hasUnsubmittedFormDraft;

    if (!resumeDraft) {
        itemForm.reset();
        formMessage.textContent = "";
        syncCustomOption("category", customCategoryInput);
        syncCustomOption("unit", customUnitInput);
    }

    editingSku = item ? item.sku : null;
    hasUnsubmittedFormDraft = false;

    document.getElementById("formTitle").textContent =
        item ? "Edit Item" : "Add New Item";

    document.getElementById("saveBtn").textContent =
        item ? "Update Item" : "Save Item";

    document.getElementById("sku").readOnly = Boolean(item);

    if (resumeDraft) {
        formMessage.textContent = "";
    } else if (item) {
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

function closeForm({ discardDraft = false } = {}) {
    formPanel.classList.remove("visible");
    formPanel.hidden = true;
    document.body.classList.remove("modal-open");
    formMessage.textContent = "";

    hasUnsubmittedFormDraft = !discardDraft && !editingSku;
    editingSku = null;

    if (discardDraft) {
        itemForm.reset();
        hasUnsubmittedFormDraft = false;
        syncCustomOption("category", customCategoryInput);
        syncCustomOption("unit", customUnitInput);
    }

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

    const codeSub = document.getElementById("viewItemCodeSub");
    if (codeSub) codeSub.textContent = `SKU: ${item.sku}`;

    const itemName = document.getElementById("viewItemName");
    if (itemName) itemName.textContent = item.name;

    const itemSku = document.getElementById("viewItemSku");
    if (itemSku) itemSku.textContent = item.sku;

    const itemCat = document.getElementById("viewItemCategory");
    if (itemCat) itemCat.textContent = item.category;

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
    () => closeForm({ discardDraft: true })
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

    if (!event.target.closest(".filter-select-wrapper")) {
        closeFilterDropdowns();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        const openFilter = document.querySelector(
            ".filter-select-wrapper.is-open"
        );
        if (openFilter) {
            closeFilterDropdown(openFilter);
            openFilter.querySelector(".filter-select-trigger").focus();
            return;
        }

        if (!formPanel.hidden) {
            closeForm({ discardDraft: true });
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

statusFilter.addEventListener(
    "change",
    renderItems
);

initializeFilterDropdown(categoryFilter);
initializeFilterDropdown(statusFilter);
window.addEventListener("resize", closeFilterDropdowns);
window.addEventListener("scroll", closeFilterDropdowns);
document.querySelector(".table-wrapper").addEventListener(
    "scroll",
    closeFilterDropdowns
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
