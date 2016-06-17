define([
    "text!./todo.html",
    "text!./todo-task.html",
    "text!./todo-toolbar.html",
    "text!./todo-dialog.html",
    "zepto"
], function (todoTemplate, taskTemplate, toolbarTemplate, dialogTemplate, $) {
    /**
     * @param {mct.MCT} mct
     */
    return function todoPlugin(mct) {
        var todoType = new mct.Type({
            metadata: {
                label: "To-Do List",
                glyph: "2",
                description: "A list of things that need to be done."
            },
            initialize: function (model) {
                model.tasks = [
                    { description: "This is a task." }
                ];
            },
            creatable: true
        });

        function TodoView(domainObject) {
            this.domainObject = domainObject;
            this.filterValue = "all";
        }

        TodoView.prototype.show = function (container) {
            this.destroy();

            this.$els = $(todoTemplate);
            this.$buttons = {
                all: this.$els.find('.example-todo-button-all'),
                incomplete: this.$els.find('.example-todo-button-incomplete'),
                complete: this.$els.find('.example-todo-button-complete')
            };

            $(container).empty().append(this.$els);

            this.initialize();
            this.render();

            mct.verbs.observe(this.domainObject, this.render.bind(this));
        };

        TodoView.prototype.destroy = function () {
            if (this.unlisten) {
                this.unlisten();
                this.unlisten = undefined;
            }
        };

        TodoView.prototype.setFilter = function (value) {
            this.filterValue = value;
            this.render();
        };

        TodoView.prototype.initialize = function () {
            Object.keys(this.$buttons).forEach(function (k) {
                this.$buttons[k].on('click', this.setFilter.bind(this, k));
            }, this);
        };

        TodoView.prototype.render = function () {
            var $els = this.$els;
            var domainObject = this.domainObject;
            var tasks = domainObject.getModel().tasks;
            var $message = $els.find('.example-message');
            var $list = $els.find('.example-todo-task-list');
            var $buttons = this.$buttons;
            var filters = {
                all: function () {
                    return true;
                },
                incomplete: function (task) {
                    return !task.completed;
                },
                complete: function (task) {
                    return task.completed;
                }
            };
            var filterValue = this.filterValue;

            Object.keys($buttons).forEach(function (k) {
                $buttons[k].toggleClass('selected', filterValue === k);
            });
            tasks = tasks.filter(filters[filterValue]);

            $list.empty();
            tasks.forEach(function (task, index) {
                var $taskEls = $(taskTemplate);
                var $checkbox = $taskEls.find('.example-task-checked');
                var $desc = $taskEls.find('.example-task-description');
                $checkbox.prop('checked', task.completed);
                $desc.text(task.description);

                $checkbox.on('change', function () {
                    var checked = !!$checkbox.prop('checked');
                    mct.verbs.mutate(domainObject, function (model) {
                        model.tasks[index].completed = checked;
                    });
                });

                $desc.on('click', function () {
                    mct.verbs.mutate(domainObject, function (model) {
                        model.selected = index;
                    });
                });

                if (domainObject.getModel().selected === index) {
                    $desc.addClass('selected');
                }

                $list.append($taskEls);
            });

            $message.toggle(tasks.length < 1);
        };



        function TodoToolbarView(domainObject) {
            this.domainObject = domainObject;
        }

        TodoToolbarView.prototype.show = function (container) {
            this.destroy();

            var $els = $(toolbarTemplate);
            var $add = $els.find('a.example-add');
            var $remove = $els.find('a.example-remove');
            var domainObject = this.domainObject;

            $(container).append($els);

            $add.on('click', function () {
                var $dialog = $(dialogTemplate),
                    view = {
                        show: function (container) {
                            $(container).append($dialog);
                        },
                        destroy: function () {}
                    };

                mct.dialog(view, "Add a Task").then(function () {
                    var description = $dialog.find('input').val();
                    mct.verbs.mutate(domainObject, function (model) {
                        model.tasks.push({ description: description });
                        console.log(model);
                    });
                });
            });
            $remove.on('click', function () {
                var index = domainObject.getModel().selected;
                if (index !== undefined) {
                    mct.verbs.mutate(domainObject, function (model) {
                        model.tasks = model.tasks.filter(function (t, i) {
                            return i !== index;
                        });
                        delete model.selected;
                    });
                }
            });
        };

        TodoToolbarView.prototype.destroy = function () {

        };

        mct.type('example.todo', todoType);
        mct.view(mct.regions.main, function (domainObject) {
            return todoType.check(domainObject) && new TodoView(domainObject);
        });
        mct.view(mct.regions.toolbar, function (domainObject) {
            return todoType.check(domainObject) && new TodoToolbarView(domainObject);
        });

        return mct;
    };
});