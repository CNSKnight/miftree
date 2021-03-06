/**
 * Tree.Checkbox
 * @changelog - [0.9.2] must now require/import checkbox and init w/(tree, type)
 */
const checks = ['checkbox', 'name'];
const checkboxClick = function(event) {
    if (!~checks.indexOf(this.mouse.target)) {
        return;
    }
    this.mouse.node['switch']();
};

var treeCheckbox = {
    initCheckbox: function(type) {
        var tree = this;
        tree.checkboxType = type || 'simple';
        tree.dfltState.checked = 'unchecked';
        tree.defaults.hasCheckbox = true;
        tree.wrapper.addEvent('click', checkboxClick.bind(this));
        if (tree.checkboxType === 'simple') return;
        tree.addEvent('loadChildren', function(node) {
            if (!node) return;
            if (node.state.checked === 'checked') {
                node.recursive(function() {
                    this.state.checked = 'checked';
                });
            } else {
                node.getFirst().setParentCheckbox(1);
            }
        });

    },

    getChecked: function(includePartially) {
        var checked = [];
        this.root.recursive(function() {
            if (!this.hasCheckbox) {
                return;
            }
            if (includePartially ? this.state.checked !== 'unchecked' : this.state.checked === 'checked') {
                checked.push(this);
            }
        });

        return checked;
    },

    /**
     * provide an id property on your checkbox nodes, or the nodes UID property will be provided
     */
    getCheckedIds: function(includePartially) {
        var checked = this.getChecked(includePartially);
        var ids = [];
        checked.each(function(el) {
            ids.push(el.id !== undefined ? el.id : el.UID);
        });

        return ids;
    }

};

var nodeCheckbox = {
    'switch': function(state) {
        if (this.state.checked === state || !this.hasCheckbox) return this;
        var type = this.tree.checkboxType;
        var checked = this.state.checked === 'checked' ? 'unchecked' : 'checked';
        if (type === 'simple') {
            this.setCheckboxState(checked);
            this.tree.fireEvent(checked === 'checked' ? 'check' : 'unCheck', this);
            this.tree.fireEvent('switch', [this, (checked === 'checked' ? true : false)]);
            return this;
        };
        this.recursive(function() {
            this.setCheckboxState(checked);
        });
        this.setParentCheckbox();
        this.tree.fireEvent(checked === 'checked' ? 'check' : 'unCheck', this);
        this.tree.fireEvent('switch', [this, (checked === 'checked' ? true : false)]);
        return this;
    },

    setCheckboxState: function(state) {
        if (!this.hasCheckbox) return;
        var oldState = this.state.checked;
        this.state.checked = state;
        if ((!this.parentNode && this.tree.$draw) || (this.parentNode && this.parentNode.$draw)) {
            this.getDOM('checkbox').removeClass('mt-node-' + oldState).addClass('mt-node-' + state);
        }
    },

    setParentCheckbox: function(s) {
        if (!this.hasCheckbox || !this.parentNode || (this.tree.forest && !this.parentNode.parentNode)) return;
        var parent = this.parentNode;
        var state = '';
        var children = parent.children;
        for (var i = children.length; i--; i > 0) {
            var child = children[i];
            if (!child.hasCheckbox) continue;
            var childState = child.state.checked;
            if (childState === 'partially') {
                state = 'partially';
                break;
            } else if (childState === 'checked') {
                if (state === 'unchecked') {
                    state = 'partially';
                    break;
                }
                state = 'checked';
            } else {
                if (state === 'checked') {
                    state = 'partially';
                    break;
                } else {
                    state = 'unchecked';
                }
            }
        }
        if (parent.state.checked === state || (s && state === 'partially' && parent.state.checked === 'checked')) { return; };
        parent.setCheckboxState(state);
        parent.setParentCheckbox(s);
    }

};

export { treeCheckbox, nodeCheckbox };