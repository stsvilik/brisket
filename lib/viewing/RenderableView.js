"use strict";

var _ = require("lodash");
var HasChildViews = require("../viewing/HasChildViews");
var ReattachableView = require("../viewing/ReattachableView");
var StringTemplateAdapter = require("../templating/StringTemplateAdapter");
var TemplateAdapter = require("../templating/TemplateAdapter");
var noop = require("../util/noop");

function modelToJSON(model) {
    if (!model) {
        return null;
    }

    return model.toJSON();
}

var RenderableView = _.extend({},
    HasChildViews,
    ReattachableView, {

        beforeRender: noop,

        afterRender: noop,

        onDOM: noop,

        modelForView: noop,

        logic: noop,

        decorators: null,

        partials: null,

        templateAdapter: StringTemplateAdapter,

        rawRenderedHTML: null,

        isInDOM: false,

        enterDOM: function() {
            if (this.isInDOM) {
                return;
            }

            this.onDOM();
            this.isInDOM = true;

            this.trigger("on-dom");

            this.foreachChildView(function(childView) {
                childView.enterDOM();
            });

            this.once("close", function() {
                this.isInDOM = false;
            }.bind(this));
        },

        templateData: function() {
            var modelForView = this.modelForView() || modelToJSON(this.model);

            return _.extend({}, modelForView, this.logic());
        },

        renderTemplate: function() {
            if (!this.template) {
                return;
            }

            if (!this.templateAdapter) {
                throw new Error(
                    "You must specify a templateAdapter for a View. " + this + " is missing a templateAdapter"
                );
            }

            if (!TemplateAdapter.isPrototypeOf(this.templateAdapter)) {
                throw new Error(
                    this + " templateAdapter must extend from Brisket.Templating.TemplateAdapter."
                );
            }

            this.rawRenderedHTML = this.templateAdapter.templateToHTML(
                this.template,
                this.templateData(),
                this.partials
            );

            this.el.innerHTML = this.rawRenderedHTML;
        },

        renderUnrenderedChildViews: function() {
            if (!this.unrenderedChildViews) {
                return;
            }

            for (var i = 0, len = this.unrenderedChildViews.length; i < len; i++) {
                var viewRelationship = this.unrenderedChildViews[i];

                viewRelationship.renderChildViewIntoParent();
            }

            this.unrenderedChildViews.length = 0;
        },

        reattachUnrenderedChildViews: function() {
            if (!this.unrenderedChildViews) {
                return;
            }

            for (var i = 0, len = this.unrenderedChildViews.length; i < len; i++) {
                var viewRelationship = this.unrenderedChildViews[i];

                viewRelationship.reattach();
                viewRelationship.childView.render();
            }

            this.unrenderedChildViews.length = 0;
        },

        runDecorators: function() {
            if (!this.decorators) {
                return;
            }

            var $el = this.$el;

            for (var i = 0, len = this.decorators.length; i < len; i++) {
                var decorator = this.decorators[i];

                decorator.decorate($el);
            }
        },

        render: function() {
            this.establishIdentity();

            this.beforeRender();

            if (this.isAttached) {
                this.reattachUnrenderedChildViews();
            }

            if (this.isNotAlreadyAttachedToDOM()) {
                this.renderTemplate();
                this.renderUnrenderedChildViews();
            }

            this.hasBeenRendered = true;

            this.afterRender();

            if (this.isNotAlreadyAttachedToDOM()) {
                this.runDecorators();
            }

            return this;
        }

    }
);

module.exports = RenderableView;

// ----------------------------------------------------------------------------
// Copyright (C) 2015 Bloomberg Finance L.P.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------- END-OF-FILE ----------------------------------
