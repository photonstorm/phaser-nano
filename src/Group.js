/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

PhaserNano.Group = function (game) {

    this.game = game;

    this.children = [];

};

PhaserNano.Group.prototype = {

    add: function (child) {

        return this.addAt(child, this.children.length);

    },

    addAt: function (child, index) {

        this.children.splice(index, 0, child);

        return child;

    },

    swap: function (child, child2) {

        if (child === child2)
        {
            return;
        }

        var index1 = this.children.indexOf(child);
        var index2 = this.children.indexOf(child2);

        if (index1 < 0 || index2 < 0)
        {
            return false;
        }

        this.children[index1] = child2;
        this.children[index2] = child;

        return true;

    },

    getIndex: function (child) {

        return this.children.indexOf(child);

    },

    getAt: function (index) {

        if (index < 0 || index >= this.children.length)
        {
            return false;
        }
        else
        {
            return this.children[index];
        }

    },

    remove: function (child) {

        var index = this.children.indexOf(child);

        if (index !== -1)
        {
            return this.removeAt(index);
        }

    },

    removeAt: function (index) {

        var child = this.getAt(index);

        if (child)
        {
            this.children.splice(index, 1);
        }

        return child;

    },

    bringToTop: function (child)  {

        if (this.getIndex(child) < this.children.length)
        {
            this.remove(child);
            this.add(child);
        }

        return child;

    },

    sendToBack: function (child) {

        if (this.getIndex(child) > 0)
        {
            this.remove(child);
            this.addAt(child, 0);
        }

        return child;

    },

    moveUp: function (child) {

        var a = this.getIndex(child);

        if (a < this.children.length - 1)
        {
            var b = this.getAt(a + 1);

            if (b)
            {
                this.swap(child, b);
            }
        }

        return child;

    },

    moveDown: function (child) {

        var a = this.getIndex(child);

        if (a > 0)
        {
            var b = this.getAt(a - 1);

            if (b)
            {
                this.swap(child, b);
            }
        }

        return child;

    },

    filter: function (callback, context) {

        var index = -1;
        var length = this.children.length;
        var results = [];

        while (++index < length)
        {
            var child = this.children[index];

            if (callback.call(context, child))
            {
                results.push(child);
            }
        }

        return results;

    },

    forEach: function (callback, context) {

        if (arguments.length <= 2)
        {
            for (var i = 0; i < this.children.length; i++)
            {
                callback.call(context, this.children[i]);
            }
        }
        else
        {
            // Assigning to arguments properties causes Extreme Deoptimization in Chrome, FF, and IE.
            // Using an array and pushing each element (not a slice!) is _significantly_ faster.
            var args = [null];

            for (var i = 2; i < arguments.length; i++)
            {
                args.push(arguments[i]);
            }

            for (var i = 0; i < this.children.length; i++)
            {
                args[0] = this.children[i];
                callback.apply(context, args);
            }
        }

    },

    /**
    * Iterates over the children of the group performing one of several actions for matched children.
    *
    * A child is considered a match when it has a property, named `key`, whose value is equal to `value`
    * according to a strict equality comparison.
    *
    * The result depends on the `returnType`:
    *
    * - {@link Phaser.Group.RETURN_TOTAL RETURN_TOTAL}:
    *     The callback, if any, is applied to all matching children. The number of matched children is returned.
    * - {@link Phaser.Group.RETURN_NONE RETURN_NONE}:
    *     The callback, if any, is applied to all matching children. No value is returned.
    * - {@link Phaser.Group.RETURN_CHILD RETURN_CHILD}:
    *     The callback, if any, is applied to the *first* matching child and the *first* matched child is returned.
    *     If there is no matching child then null is returned.
    *
    * If `args` is specified it must be an array. The matched child will be assigned to the first
    * element and the entire array will be applied to the callback function.
    *
    * @method Phaser.Group#iterate
    * @param {string} key - The child property to check, i.e. 'exists', 'alive', 'health'
    * @param {any} value - A child matches if `child[key] === value` is true.
    * @param {boolean} returnChild - How to iterate the children and what to return.
    * @param {function} [callback=null] - Optional function that will be called on each matching child. The matched child is supplied as the first argument.
    * @param {object} [context] - The context in which the function should be called (usually 'this').
    * @param {any[]} [args=(none)] - The arguments supplied to to the callback; the first array index (argument) will be replaced with the matched child.
    * @return {any} Returns either an integer (for RETURN_TOTAL), the first matched child (for RETURN_CHILD), or null.
    */
    iterate: function (key, value, returnChild, callback, context, args) {

        var total = 0;

        for (var i = 0; i < this.children.length; i++)
        {
            if (this.children[i][key] === value)
            {
                total++;

                if (callback)
                {
                    if (args)
                    {
                        args[0] = this.children[i];
                        callback.apply(context, args);
                    }
                    else
                    {
                        callback.call(context, this.children[i]);
                    }
                }

                if (returnChild)
                {
                    return this.children[i];
                }
            }
        }

        if (!returnChild)
        {
            return total;
        }

        return null;

    },

    getFirstAlive: function () {

        return this.iterate('alive', true, true);

    },

    getFirstDead: function () {

        return this.iterate('alive', false, true);

    }

};