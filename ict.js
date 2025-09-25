document.addEventListener('DOMContentLoaded', () => {
  const cartIcon = document.querySelector('#cart');
  const cartTab = document.querySelector('#carttab');
  const closeBtn = document.querySelector('#cartbuttons button:nth-child(2)');

  if (!cartTab) return;

  const openCart = () => {
    cartTab.style.inset = '0 0 0 auto';
  };

  const closeCart = () => {
    cartTab.style.inset = '0 -400px 0 auto';
  };

  // Open on cart icon click
  if (cartIcon) {
    cartIcon.addEventListener('click', (e) => {
      e.preventDefault();
      openCart();
    });
  }

  // Helper: attach handlers to a quantity cell and ensure a Remove button exists
  function wireQuantityCell(qtyDiv, refs) {
    if (!qtyDiv) return;
    let minus = qtyDiv.querySelector('.minus');
    let count = qtyDiv.querySelector('.count');
    let plus = qtyDiv.querySelector('.plus');
    let removeBtn = qtyDiv.querySelector('button');

    // Create missing spans if needed
    if (!minus) { minus = document.createElement('span'); minus.className = 'minus'; minus.textContent = '−'; qtyDiv.prepend(minus); }
    if (!count) { count = document.createElement('span'); count.className = 'count'; count.textContent = '1'; qtyDiv.appendChild(count); }
    if (!plus)  { plus  = document.createElement('span'); plus.className  = 'plus';  plus.textContent  = '+'; qtyDiv.appendChild(plus); }
    if (!removeBtn) {
      removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = 'Remove';
      removeBtn.style.marginLeft = '6px';
      removeBtn.style.height = '25px';
      removeBtn.style.borderRadius = '12px';
      qtyDiv.appendChild(removeBtn);
    }

    // Ensure labels/symbols are standardized even for pre-existing elements
    if (minus) {
      minus.textContent = '−';
      minus.setAttribute('aria-label', 'Decrease quantity');
      minus.setAttribute('role', 'button');
      minus.setAttribute('tabindex', '0');
    }
    if (plus) {
      plus.textContent = '+';
      plus.setAttribute('aria-label', 'Increase quantity');
      plus.setAttribute('role', 'button');
      plus.setAttribute('tabindex', '0');
    }

    // Keyboard support: Enter/Space activates the control
    const keyActivate = (el) => {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          el.click();
        }
      });
    };
    if (minus) keyActivate(minus);
    if (plus) keyActivate(plus);

    minus.addEventListener('click', () => {
      const current = Math.max(1, (parseInt(count.textContent, 10) || 1) - 1);
      count.textContent = String(current);
      updateCartCount();
    });
    plus.addEventListener('click', () => {
      const current = (parseInt(count.textContent, 10) || 1) + 1;
      count.textContent = String(current);
      updateCartCount();
    });
    removeBtn.addEventListener('click', () => {
      const cartItems = document.querySelector('#cartitems');
      if (!cartItems) return;
      if (refs?.imgWrap) cartItems.removeChild(refs.imgWrap);
      if (refs?.nameDiv) cartItems.removeChild(refs.nameDiv);
      if (refs?.priceDiv) cartItems.removeChild(refs.priceDiv);
      cartItems.removeChild(qtyDiv);
      updateCartCount();
    });
  }

  // Wire any pre-existing cart rows (e.g., the first hard-coded item)
  function wireExistingCartRows() {
    const cartItems = document.querySelector('#cartitems');
    if (!cartItems) return;
    const children = Array.from(cartItems.children);
    for (let i = 0; i + 3 < children.length; i += 4) {
      const imgWrap = children[i];
      const nameDiv = children[i + 1];
      const priceDiv = children[i + 2];
      const qtyDiv = children[i + 3];

      // Also show price right next to the product name (without removing the price column)
      if (nameDiv && priceDiv && !nameDiv.querySelector('.name-price')) {
        const priceText = (priceDiv.textContent || '').trim();
        // Capture and store a clean product name (before appending price)
        const baseName = (nameDiv.childNodes[0]?.textContent || nameDiv.textContent || '').split('•')[0].trim();
        if (baseName) nameDiv.dataset.name = baseName;
        const priceSpan = document.createElement('span');
        priceSpan.className = 'name-price';
        priceSpan.textContent = ` ${priceText ? `• ${priceText}` : ''}`;
        nameDiv.appendChild(priceSpan);
      }
      wireQuantityCell(qtyDiv, { imgWrap, nameDiv, priceDiv });
    }
    updateCartCount();
  }

  // Close on Close button click
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeCart();
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCart();
  });

  // Helper: update the total cart count (sum of all quantities)
  function updateCartCount() {
    const countEl = document.getElementById('cart-count');
    if (!countEl) return;
    const counts = Array.from(document.querySelectorAll('#cartitems .quantity .count'))
      .map(el => parseInt(el.textContent, 10) || 0);
    const total = counts.reduce((a, b) => a + b, 0);
    countEl.textContent = String(total);

    // Show/hide the empty cart message based on total
    const cartItems = document.getElementById('cartitems');
    if (!cartItems) return;
    let emptyMsg = document.getElementById('cart-empty-message');
    if (!emptyMsg) {
      emptyMsg = document.createElement('div');
      emptyMsg.id = 'cart-empty-message';
      emptyMsg.textContent = 'Your cart is empty';
      emptyMsg.style.fontFamily = 'cursive';
      emptyMsg.style.opacity = '0.85';
      emptyMsg.style.padding = '16px 0';
      emptyMsg.style.gridColumn = '1 / -1'; // span full grid width
      cartItems.appendChild(emptyMsg);
    }

    if (total === 0) {
      // If no quantities found, show the message
      emptyMsg.style.display = '';
    } else {
      // Hide the message when we have at least one item
      emptyMsg.style.display = 'none';
    }
  }

  // Helper: find existing cart entry by name; returns {nameDiv, qtyDiv, countEl} or null
  function findExistingCartEntry(name) {
    const nameDivs = Array.from(document.querySelectorAll('#cartitems .name'));
    for (const nameDiv of nameDivs) {
      const target = (name || '').trim();
      const stored = (nameDiv.dataset?.name || '').trim();
      const visibleText = (nameDiv.textContent || '').split('•')[0].trim();
      if ((stored && stored === target) || (!stored && visibleText === target)) {
        // quantity div is the next sibling in our 4-column pattern
        const qtyDiv = nameDiv.nextElementSibling?.nextElementSibling; // price -> quantity
        const countEl = qtyDiv ? qtyDiv.querySelector('.count') : null;
        if (qtyDiv && countEl) return { nameDiv, qtyDiv, countEl };
      }
    }
    return null;
  }

  // Expose addToCart globally for inline onclick handlers in index.html
  window.addToCart = function(name) {
    const cartItems = document.querySelector('#cartitems');
    if (!cartItems) return;

    // If item already in cart, just increment its quantity
    const existing = findExistingCartEntry(name || '');
    if (existing) {
      const current = (parseInt(existing.countEl.textContent, 10) || 1) + 1;
      existing.countEl.textContent = String(current);
      updateCartCount();
      openCart();
      return;
    }

    // Find the product card by its name
    const product = Array.from(document.querySelectorAll('#contentpics .item')).find(it => {
      const title = it.querySelector('h5');
      return title && title.textContent.trim() === (name || '').trim();
    });

    // Extract image src and price
    let imgSrc = '';
    let priceText = 'PKR —';
    if (product) {
      const imgEl = product.querySelector('img');
      const priceEl = product.querySelector('.price');
      imgSrc = imgEl ? imgEl.src : '';
      priceText = priceEl ? priceEl.textContent.trim() : priceText;
    }

    // Create a new row: image | name | price | quantity
    const imgWrap = document.createElement('div');
    imgWrap.className = 'image';
    const img = document.createElement('img');
    img.src = imgSrc;
    imgWrap.appendChild(img);

    const nameDiv = document.createElement('div');
    nameDiv.className = 'name';
    // Put price next to the name as well
    const safeName = (name || 'Item').trim();
    nameDiv.innerHTML = `${safeName} <span class="name-price">• ${priceText}</span>`;
    // Store a clean name for reliable matching later
    nameDiv.dataset.name = safeName;

    const priceDiv = document.createElement('div');
    priceDiv.className = 'price';
    priceDiv.textContent = priceText;

    const qtyDiv = document.createElement('div');
    qtyDiv.className = 'quantity';
    const minus = document.createElement('span'); minus.className = 'minus'; minus.textContent = '−';
    const count = document.createElement('span'); count.className = 'count'; count.textContent = '1';
    const plus = document.createElement('span'); plus.className = 'plus'; plus.textContent = '+';
    // Remove button inside quantity cell
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.style.marginLeft = '6px';
    removeBtn.style.height = '25px';
    removeBtn.style.borderRadius = '12px';
    qtyDiv.append(minus, count, plus, removeBtn);

    // Wire quantity controls
    wireQuantityCell(qtyDiv, { imgWrap, nameDiv, priceDiv });

    // Append to cart grid
    cartItems.append(imgWrap, nameDiv, priceDiv, qtyDiv);

    // Update cart count
    updateCartCount();

    // Open cart to show the added item
    openCart();
  };

  // Initialize any existing rows (handles your first item)
  wireExistingCartRows();

  // Search filtering: hide non-matching items in the catalog
  const searchInput = document.querySelector('.sbar');
  const searchButton = document.querySelector('#navbar button');

  function normalize(str) {
    return (str || '').toLowerCase().trim();
  }

  function filterCatalog(query) {
    const q = normalize(query);
    const items = Array.from(document.querySelectorAll('#contentpics .item'));
    if (!q) {
      items.forEach(it => it.classList.remove('hide'));
      return;
    }

    // Prefer exact title matches (case-insensitive)
    const exactMatches = items.filter((it) => {
      const title = normalize(it.querySelector('h5')?.textContent || '');
      return title === q;
    });

    if (exactMatches.length > 0) {
      items.forEach((it) => {
        if (exactMatches.includes(it)) it.classList.remove('hide');
        else it.classList.add('hide');
      });
      // Scroll the first exact match into view
      exactMatches[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    // Fallback: substring match on title or price
    items.forEach((it) => {
      const title = it.querySelector('h5')?.textContent || '';
      const price = it.querySelector('.price')?.textContent || '';
      const haystack = (title + ' ' + price).toLowerCase();
      if (haystack.includes(q)) it.classList.remove('hide');
      else it.classList.add('hide');
    });
  }

  if (searchInput) {
    // Live filter as the user types
    searchInput.addEventListener('input', (e) => {
      filterCatalog(e.target.value);
    });
    // Escape clears the search and shows all
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        filterCatalog('');
      }
    });
  }

  if (searchButton && searchInput) {
    searchButton.addEventListener('click', (e) => {
      e.preventDefault();
      filterCatalog(searchInput.value);
    });
  }
});
