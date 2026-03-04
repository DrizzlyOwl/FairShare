/* global Event */
/**
 * CustomSelect.js
 * A robust, accessible custom dropdown component that replaces standard HTML selects.
 * Adheres to BEM methodology and WCAG 2.1 AA compliance.
 */

export default class CustomSelect {
    #select;
    #container;
    #trigger;
    #dropdown;
    #optionsList;
    #isOpen = false;
    #highlightedIndex = -1;

    /**
     * @param {HTMLSelectElement} nativeSelect - The original select element to enhance.
     */
    constructor(nativeSelect) {
        if (!nativeSelect || nativeSelect.tagName !== 'SELECT') {
            throw new Error('CustomSelect requires a valid <select> element.');
        }

        this.#select = nativeSelect;
        this.#init();
    }

    /**
     * Initializes the custom select UI and hides the native one.
     */
    #init() {
        // 1. Hide native select but keep it in DOM for form submission and JS bindings
        this.#select.style.display = 'none';
        this.#select.setAttribute('aria-hidden', 'true');
        this.#select.tabIndex = -1;

        // 2. Create Custom UI
        this.#container = document.createElement('div');
        this.#container.className = 'select-custom';
        this.#select.parentNode.insertBefore(this.#container, this.#select);

        this.#trigger = document.createElement('button');
        this.#trigger.type = 'button';
        this.#trigger.className = 'select-custom__trigger';
        this.#trigger.setAttribute('role', 'combobox');
        this.#trigger.setAttribute('aria-haspopup', 'listbox');
        this.#trigger.setAttribute('aria-expanded', 'false');
        this.#trigger.setAttribute('aria-controls', `${this.#select.id}-listbox`);
        
        // Transfer data-cy for testing
        if (this.#select.dataset.cy) {
            this.#trigger.dataset.cy = this.#select.dataset.cy;
        }
        
        const label = document.querySelector(`label[for="${this.#select.id}"]`);
        if (label) {
            this.#trigger.setAttribute('aria-labelledby', label.id || `${this.#select.id}-label`);
            if (!label.id) label.id = `${this.#select.id}-label`;
        }

        this.#updateTriggerText();

        const icon = document.createElement('span');
        icon.className = 'select-custom__icon icon--chevron-down';
        this.#trigger.appendChild(icon);

        this.#dropdown = document.createElement('div');
        this.#dropdown.className = 'select-custom__dropdown';

        this.#optionsList = document.createElement('ul');
        this.#optionsList.className = 'select-custom__options';
        this.#optionsList.setAttribute('role', 'listbox');
        this.#optionsList.id = `${this.#select.id}-listbox`;
        this.#optionsList.tabIndex = -1;

        this.#renderOptions();

        this.#dropdown.appendChild(this.#optionsList);
        this.#container.appendChild(this.#trigger);
        this.#container.appendChild(this.#dropdown);

        // 3. Bind Events
        this.#bindEvents();
    }

    #updateTriggerText() {
        const selectedOption = this.#select.options[this.#select.selectedIndex];
        const text = selectedOption ? selectedOption.text : 'Select...';
        
        // Remove existing text node if any
        if (this.#trigger.firstChild && this.#trigger.firstChild.nodeType === 3) {
            this.#trigger.firstChild.textContent = text;
        } else {
            this.#trigger.prepend(document.createTextNode(text));
        }
    }

    #renderOptions() {
        this.#optionsList.innerHTML = '';
        Array.from(this.#select.options).forEach((opt, index) => {
            const li = document.createElement('li');
            li.className = 'select-custom__option';
            if (index === this.#select.selectedIndex) {
                li.classList.add('select-custom__option--selected');
                li.setAttribute('aria-selected', 'true');
            } else {
                li.setAttribute('aria-selected', 'false');
            }
            li.setAttribute('role', 'option');
            li.textContent = opt.text;
            li.dataset.value = opt.value;
            li.dataset.index = index;

            li.addEventListener('click', (e) => {
                e.stopPropagation();
                this.#selectOption(index);
            });

            this.#optionsList.appendChild(li);
        });
    }

    #bindEvents() {
        this.#trigger.addEventListener('click', () => this.#toggle());

        document.addEventListener('click', (e) => {
            if (!this.#container.contains(e.target) && this.#isOpen) {
                this.#close();
            }
        });

        this.#trigger.addEventListener('keydown', (e) => this.#handleKeyboard(e));
    }

    #toggle() {
        if (this.#isOpen) this.#close();
        else this.#open();
    }

    #open() {
        this.#isOpen = true;
        this.#container.classList.add('select-custom--open');
        this.#trigger.setAttribute('aria-expanded', 'true');
        this.#highlightedIndex = this.#select.selectedIndex;
        this.#updateHighlight();
    }

    #close() {
        this.#isOpen = false;
        this.#container.classList.remove('select-custom--open');
        this.#trigger.setAttribute('aria-expanded', 'false');
        this.#highlightedIndex = -1;
        this.#updateHighlight();
    }

    #selectOption(index) {
        this.#select.selectedIndex = index;
        this.#select.dispatchEvent(new Event('change', { bubbles: true }));
        this.#updateTriggerText();
        this.#renderOptions();
        this.#close();
        this.#trigger.focus();
    }

    #handleKeyboard(e) {
        if (!this.#isOpen) {
            if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
                e.preventDefault();
                this.#open();
            }
            return;
        }

        switch (e.key) {
            case 'Escape':
                this.#close();
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (this.#highlightedIndex >= 0) {
                    this.#selectOption(this.#highlightedIndex);
                }
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.#highlightedIndex = Math.min(this.#select.options.length - 1, this.#highlightedIndex + 1);
                this.#updateHighlight();
                this.#scrollToHighlighted();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.#highlightedIndex = Math.max(0, this.#highlightedIndex - 1);
                this.#updateHighlight();
                this.#scrollToHighlighted();
                break;
            case 'Tab':
                this.#close();
                break;
        }
    }

    #updateHighlight() {
        const options = this.#optionsList.querySelectorAll('.select-custom__option');
        options.forEach((opt, index) => {
            opt.classList.toggle('select-custom__option--highlighted', index === this.#highlightedIndex);
            if (index === this.#highlightedIndex) {
                this.#trigger.setAttribute('aria-activedescendant', opt.id || `opt-${this.#select.id}-${index}`);
                if (!opt.id) opt.id = `opt-${this.#select.id}-${index}`;
            }
        });
    }

    #scrollToHighlighted() {
        const highlighted = this.#optionsList.children[this.#highlightedIndex];
        if (highlighted) {
            highlighted.scrollIntoView({ block: 'nearest' });
        }
    }

    /**
     * Refreshes the custom UI to match the current state of the native select.
     * Useful if the native select was changed externally.
     */
    refresh() {
        this.#updateTriggerText();
        this.#renderOptions();
    }
}
